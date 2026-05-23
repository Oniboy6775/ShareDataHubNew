const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../Models/userModel");
const Settings = require("../Models/settingsModel");
const notify = require("../Utils/notify");
const sendEmail = require("../Utils/sendEmail");
const { v4: uuid } = require("uuid");

const register = async (req, res) => {
  const { email, password, userName, phoneNumber, referredBy } = req.body;
  if (!email || !password || !userName || !phoneNumber)
    return res.status(400).json({ msg: "All fields are required" });
  try {
    const existing = await User.findOne({ $or: [{ email }, { userName: userName.toLowerCase() }] });
    if (existing) return res.status(400).json({ msg: "Email or username already taken" });

    const settings = await Settings.getSingleton();
    const user = await User.create({
      email,
      password,
      userName: userName.toLowerCase(),
      phoneNumber,
      referredBy: referredBy?.toLowerCase() || "",
      balance: settings.registrationBonus || 0,
    });

    // Credit referrer earningBalance if applicable
    if (referredBy) {
      const sponsor = await User.findOne({ userName: referredBy.toLowerCase() });
      if (sponsor) {
        await User.updateOne({ _id: sponsor._id }, { $inc: { earningBalance: 0 } });
        await User.updateOne(
          { _id: sponsor._id },
          { $push: { referrals: { userName: user.userName, email: user.email, amountEarn: 0 } } }
        );
      }
    }

    await notify({
      title: "New Registration",
      body: `New user ${user.userName} just registered`,
      type: "registration",
      userId: user._id,
    });

    const token = user.createJWT();
    const { password: _, apiToken: __, ...userData } = user.toObject();
    res.status(201).json({ msg: "Registration successful", token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: error.message || "Something went wrong" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ msg: "All fields are required" });
  try {
    const identifier = email.toLowerCase();
    console.log("[login] attempting:", identifier);
    const user = await User.findOne({ $or: [{ email: identifier }, { userName: identifier }] });
    console.log("[login] user found:", !!user, "| collection:", User.collection.name);
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });
    if (user.isSuspended) return res.status(403).json({ msg: "Account suspended. Contact support." });
    const isMatch = await user.comparePassword(password);
    console.log("[login] password match:", isMatch, "| hash prefix:", user.password?.slice(0, 7));
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
    const token = user.createJWT();
    const { password: _, apiToken: __, ...userData } = user.toObject();
    if (process.env.ADMIN_ID && String(user._id) === process.env.ADMIN_ID) {
      userData.userType = "admin";
    }
    res.status(200).json({ msg: "Login successful", token, user: userData });
  } catch (error) {
    console.error("[login] error:", error.message);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    const userData = user.toObject();
    if (process.env.ADMIN_ID && String(user._id) === process.env.ADMIN_ID) {
      userData.userType = "admin";
    }
    res.status(200).json({ user: userData });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ msg: "All fields are required" });
  try {
    const user = await User.findById(req.user.userId);
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const generateApiKey = async (req, res) => {
  try {
    const newKey = uuid().replace(/-/g, "").substring(0, 30);
    await User.updateOne({ _id: req.user.userId }, { $set: { apiToken: newKey } });
    res.status(200).json({ data: { apiKey: newKey } });
  } catch (error) {
    res.status(500).json({ msg: "Error generating API key" });
  }
};

const updateProfile = async (req, res) => {
  const { webhookUrl } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { webhookUrl } },
      { new: true, select: "-password -apiToken" }
    );
    res.status(200).json({ msg: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const redeemCoupon = async (req, res) => {
  const { couponCode, coupon } = req.body;
  const code = couponCode || coupon;
  const Coupon = require("../Models/couponModel");
  if (!code) return res.status(400).json({ msg: "Please enter a coupon code" });
  try {
    const user = await User.findById(req.user.userId);
    // Accept coupon if assigned to this user OR unassigned (empty owner)
    const coupon = await Coupon.findOne({
      couponCode: code,
      $or: [{ couponOwner: user.userName }, { couponOwner: "" }],
    });
    if (!coupon) return res.status(400).json({ msg: "Invalid or already used coupon code" });
    await User.updateOne({ _id: user._id }, { $inc: { balance: coupon.amount } });
    await Coupon.deleteOne({ _id: coupon._id });
    res.status(200).json({ msg: `Wallet funded with ₦${coupon.amount}`, amount: coupon.amount });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getTransactions = async (req, res) => {
  const Transaction = require("../Models/transactionModel");
  const { page = 1, limit = 20, status, type, search } = req.query;
  try {
    const query = { trans_By: req.user.userId };
    if (status) query.trans_Status = status;
    if (type) query.trans_Type = type;
    if (search) query.$or = [
      { trans_Network: new RegExp(search, "i") },
      { phone_number: new RegExp(search, "i") },
      { trans_Id: new RegExp(search, "i") },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(query),
    ]);
    res.status(200).json({ transactions, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const setPin = async (req, res) => {
  const { pin } = req.body;
  if (!pin || !/^\d{4}$/.test(String(pin)))
    return res.status(400).json({ msg: "PIN must be exactly 4 digits" });
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(String(pin), salt);
    await User.updateOne({ _id: req.user.userId }, { transactionPin: hashed, pinEnabled: true });
    res.status(200).json({ msg: "Transaction PIN set successfully", pinEnabled: true });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const removePin = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.userId }, { $unset: { transactionPin: 1 }, $set: { pinEnabled: false } });
    res.status(200).json({ msg: "Transaction PIN removed", pinEnabled: false });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: "Email is required" });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond 200 — don't reveal whether the email exists
    if (!user) return res.status(200).json({ msg: "If that email is registered, a reset link has been sent." });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetToken = hashed;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const settings = await Settings.getSingleton();
    const frontendUrl = settings.frontendUrl || process.env.FRONTEND_URL || "";
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
    const siteName = settings.themeSiteName || "DataHub";

    await sendEmail({
      to: user.email,
      subject: `${siteName} — Password Reset`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1a2035">Reset your password</h2>
          <p>Hi <strong>${user.userName}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Reset Password
          </a>
          <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ msg: "If that email is registered, a reset link has been sent." });
  } catch (error) {
    console.error("[forgotPassword]", error.message);
    res.status(500).json({ msg: error.message.includes("SMTP") ? error.message : "Something went wrong" });
  }
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ msg: "Token and password are required" });
  try {
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetToken: hashed,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ msg: "Reset link is invalid or has expired" });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({ msg: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

module.exports = { register, login, getProfile, changePassword, generateApiKey, updateProfile, redeemCoupon, getTransactions, forgotPassword, resetPassword, setPin, removePin };
