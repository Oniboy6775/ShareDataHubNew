const axios = require("axios");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const User = require("../Models/userModel");
const Transaction = require("../Models/transactionModel");
const Plan = require("../Models/planModel");
const Settings = require("../Models/settingsModel");
const Coupon = require("../Models/couponModel");
const Notification = require("../Models/notificationModel");
const Broadcast = require("../Models/broadcastModel");
const notify = require("../Utils/notify");

// ─── Users ───────────────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { search, userType, isSpecial, page = 1, limit = 50 } = req.query;
    const query = {};
    if (search) query.$or = [{ userName: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
    if (userType) query.userType = userType;
    if (isSpecial === 'true') query.isSpecial = true;
    const [users, total, admin, agg] = await Promise.all([
      User.find(query).select("-password -apiToken").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(query),
      User.findById(req.user.userId).select("balance"),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
    ]);
    const adminBalance = admin?.balance || 0;
    const totalUserBalance = (agg[0]?.total || 0) - adminBalance;
    res.status(200).json({ users, total, adminBalance, totalUserBalance });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -apiToken");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json({ user });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const allowed = ["userType", "isSuspended", "phoneNumber"];
  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  try {
    await User.updateOne({ _id: id }, { $set: updates });
    res.status(200).json({ msg: "User updated" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const creditUser = async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) return res.status(400).json({ msg: "userId and amount required" });
  const parsed = parseFloat(amount);
  if (parsed <= 0) return res.status(400).json({ msg: "Amount must be greater than 0" });
  try {
    const [user, admin] = await Promise.all([User.findById(userId), User.findById(req.user.userId)]);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (!admin || admin.balance < parsed) return res.status(400).json({ msg: `Insufficient balance. Available: ₦${admin?.balance?.toLocaleString() || 0}` });
    await Promise.all([
      User.updateOne({ _id: userId }, { $inc: { balance: parsed } }),
      User.updateOne({ _id: req.user.userId }, { $inc: { balance: -parsed } }),
    ]);
    await Transaction.create({
      trans_Id: uuid(),
      trans_By: user._id,
      trans_UserName: user.userName,
      trans_Type: "wallet",
      trans_Network: "Admin Credit",
      phone_number: "",
      trans_amount: parsed,
      balance_Before: user.balance,
      balance_After: user.balance + parsed,
      trans_Status: "success",
      trans_profit: 0,
      trans_Date: new Date(Date.now() + 60 * 60 * 1000).toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
    });
    await notify({ title: "Wallet Funded", body: `₦${amount} manually credited to ${user.userName}`, type: "funding", userId: user._id });
    res.status(200).json({ msg: `₦${amount} credited to ${user.userName}` });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const debitUser = async (req, res) => {
  const { userId, amount, reason } = req.body;
  if (!userId || !amount) return res.status(400).json({ msg: "userId and amount required" });
  const parsed = parseFloat(amount);
  if (parsed <= 0) return res.status(400).json({ msg: "Amount must be greater than 0" });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.balance < parsed) return res.status(400).json({ msg: `Insufficient user balance. Available: ₦${user.balance?.toLocaleString() || 0}` });
    await Promise.all([
      User.updateOne({ _id: userId }, { $inc: { balance: -parsed } }),
      User.updateOne({ _id: req.user.userId }, { $inc: { balance: parsed } }),
    ]);
    await Transaction.create({
      trans_Id: uuid(),
      trans_By: user._id,
      trans_UserName: user.userName,
      trans_Type: "wallet",
      trans_Network: reason ? `Admin Debit: ${reason}` : "Admin Debit",
      phone_number: "",
      trans_amount: parsed,
      balance_Before: user.balance,
      balance_After: user.balance - parsed,
      trans_Status: "success",
      trans_profit: 0,
      trans_Date: new Date(Date.now() + 60 * 60 * 1000).toLocaleString("en-NG", { timeZone: "Africa/Lagos" }),
    });
    const body = reason ? `₦${parsed} debited from ${user.userName}. Reason: ${reason}` : `₦${parsed} debited from ${user.userName}`;
    await notify({ title: "Wallet Debited", body, type: "debit", userId: user._id });
    res.status(200).json({ msg: `₦${parsed} debited from ${user.userName}` });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const setSpecialPricing = async (req, res) => {
  const { id } = req.params;
  const { prices } = req.body; // [{ planId, price }]
  if (!Array.isArray(prices)) return res.status(400).json({ msg: "prices must be an array" });
  try {
    await User.updateOne({ _id: id }, { $set: { isSpecial: prices.length > 0, specialPrices: prices } });
    res.status(200).json({ msg: "Special pricing updated" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// ─── Transactions ─────────────────────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    const { search, userName, status, type, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.trans_Status = status;
    if (type) query.trans_Type = type;
    if (userName) query.trans_UserName = new RegExp(userName, "i");
    else if (search) query.$or = [{ trans_UserName: new RegExp(search, "i") }, { phone_number: new RegExp(search, "i") }];
    const txns = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Transaction.countDocuments(query);
    res.status(200).json({ transactions: txns, total });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const refundTransaction = async (req, res) => {
  const { transactionId } = req.body;
  try {
    const tx = await Transaction.findOne({ trans_Id: transactionId });
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });
    if (tx.trans_Status === "refunded") return res.status(400).json({ msg: "Already refunded" });
    await User.updateOne({ _id: tx.trans_By }, { $inc: { balance: tx.trans_amount } });
    await Transaction.updateOne({ trans_Id: transactionId }, { $set: { trans_Status: "refunded", trans_profit: 0, trans_volume_ratio: 0 } });
    await notify({ title: "Refund Issued", body: `₦${tx.trans_amount} refunded to ${tx.trans_UserName}`, type: "refund", userId: tx.trans_By });
    res.status(200).json({ msg: "Transaction refunded" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// ─── Plans ────────────────────────────────────────────────────────────────────
const getAdminPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ planId: 1 });
    res.status(200).json({ plans });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const updatePlanPrice = async (req, res) => {
  const { id } = req.params;
  const { sellingPrice, resellerPrice, apiPrice, isAvailable, isHot } = req.body;
  try {
    const updates = {};
    if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;
    if (resellerPrice !== undefined) updates.resellerPrice = resellerPrice;
    if (apiPrice !== undefined) updates.apiPrice = apiPrice;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;
    if (isHot !== undefined) updates.isHot = isHot;
    await Plan.updateOne({ _id: id }, { $set: updates });
    res.status(200).json({ msg: "Plan updated" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const syncPlans = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    if (!settings.mainPlatformUrl || !settings.mainPlatformApiKey)
      return res.status(400).json({ msg: "Main platform not configured in settings" });
    const { data } = await axios.get(`${settings.mainPlatformUrl}/dataPlan/fetch`, {
      headers: { Authorization: `Bearer ${settings.mainPlatformApiKey}` },
    });
    const plans = Array.isArray(data) ? data : [];
    const returnedIds = [];
    let upserted = 0;

    for (const p of plans) {
      const planId = p.id ?? p.planId;
      if (planId == null) continue;
      returnedIds.push(Number(planId));
      // p.price = what the affiliate pays on the main platform:
      //   special price (if the affiliate account has isSpecial + specialPrices)
      //   OR apiPrice (if the affiliate account is "api user")
      // This is the true cost price for the affiliate.
      const costPrice = p.price || 0;

      await Plan.findOneAndUpdate(
        { planId: Number(planId) },
        {
          $set: {
            costPrice,
          },
          $setOnInsert: {
            planId: Number(planId),
            network: p.plan_network,
            planName: p.plan,
            planType: p.plan_type,
            planCategory: p.planCategory || "",
            sellingPrice:  costPrice,
            resellerPrice: 0,
            apiPrice:      costPrice,
            isAvailable: true,
          },
        },
        { upsert: true }
      );
      upserted++;
    }

    // Plans that were NOT in this sync response no longer exist on the main
    // platform (or are unavailable) — mark them unavailable locally.
    let markedUnavailable = 0;
    if (returnedIds.length > 0) {
      const result = await Plan.updateMany(
        { planId: { $nin: returnedIds } },
        { $set: { isAvailable: false } }
      );
      markedUnavailable = result.modifiedCount;
    }

    res.status(200).json({
      msg: `Synced ${upserted} plans · ${markedUnavailable} marked unavailable (not in response)`,
    });
  } catch (e) {
    console.error("[syncPlans]", e?.response?.data || e.message);
    res.status(500).json({ msg: "Sync failed. Check main platform API key and URL." });
  }
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
const generateCoupon = async (req, res) => {
  const { userName, amount, count = 1 } = req.body;
  if (!amount) return res.status(400).json({ msg: "amount is required" });
  try {
    let ownerName = "";
    if (userName) {
      const user = await User.findOne({ userName: userName.trim().toLowerCase() });
      if (!user) return res.status(404).json({ msg: "User not found" });
      ownerName = user.userName;
    }
    const coupons = [];
    for (let i = 0; i < Math.min(count, 100); i++) {
      const code = uuid().replace(/-/g, "").substring(0, 16).toUpperCase();
      coupons.push({ couponCode: code, couponOwner: ownerName, amount });
    }
    const Coupon = require("../Models/couponModel");
    await Coupon.insertMany(coupons);
    res.status(200).json({ msg: `${coupons.length} coupon(s) generated`, coupons });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const listCoupons = async (req, res) => {
  try {
    const Coupon = require("../Models/couponModel");
    const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ coupons });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// ─── Notifications ────────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.status(200).json({ notifications });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (ids?.length) {
      await Notification.updateMany({ _id: { $in: ids } }, { $set: { isRead: true } });
    } else {
      await Notification.updateMany({}, { $set: { isRead: true } });
    }
    res.status(200).json({ msg: "Marked as read" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ count });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// ─── Settings ─────────────────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    const paymentEnv = {
      MONNIFY_API_KEY:       !!(settings.monnifyApiKey       || process.env.MONNIFY_API_KEY),
      MONNIFY_SECRET_KEY:    !!(settings.monnifySecretKey    || process.env.MONNIFY_SECRET_KEY),
      MONNIFY_CONTRACT_CODE: !!(settings.monnifyContractCode || process.env.MONNIFY_CONTRACT_CODE),
      MONNIFY_BASE_URL:      !!(settings.monnifyBaseUrl      || process.env.MONNIFY_BASE_URL),
      FRONTEND_URL:          !!(settings.frontendUrl         || process.env.FRONTEND_URL),
      BILLSTACK_API:         !!(settings.billstackApi        || process.env.BILLSTACK_API),
      BILLSTACK_SECRET:      !!(settings.billstackSecret     || process.env.BILLSTACK_SECRET),
    };
    res.status(200).json({ settings, paymentEnv });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const updateSettings = async (req, res) => {
  const allowed = [
    "registrationBonus", "mainPlatformApiKey", "mainPlatformUrl", "commissionPerPlan",
    "themeSiteName", "themeLogoUrl", "themeSupportPhone", "themeChannelLink",
    "themeNavbar", "themePrimary", "themeSecondary", "themeDark", "themeDarker", "themeLight",
    "monnifyApiKey", "monnifySecretKey", "monnifyContractCode", "monnifyBaseUrl", "frontendUrl",
    "smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom",
    "billstackApi", "billstackSecret", "billstackBanks",
  ];
  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  try {
    await Settings.updateOne({}, { $set: updates }, { upsert: true });
    res.status(200).json({ msg: "Settings updated" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getPublicTheme = async (req, res) => {
  try {
    const s = await Settings.getSingleton();
    res.status(200).json({
      siteName:      s.themeSiteName      || null,
      logoUrl:       s.themeLogoUrl       || null,
      supportPhone:  s.themeSupportPhone  || null,
      channelLink:   s.themeChannelLink   || null,
      googleFormUrl:   s.googleFormUrl      || null,
      billstackBanks:  s.billstackBanks    || "PALMPAY,MONIEPOINT,WEMA",
      navbar:        s.themeNavbar        || null,
      primary:       s.themePrimary       || null,
      secondary:     s.themeSecondary     || null,
      dark:          s.themeDark          || null,
      darker:        s.themeDarker        || null,
      light:         s.themeLight         || null,
    });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// ─── Dashboard summary ────────────────────────────────────────────────────────
const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const gbAgg = (from) => Transaction.aggregate([
      { $match: { trans_Type: "data", trans_Status: "success", createdAt: { $gte: from } } },
      { $group: { _id: null, gb: { $sum: "$trans_volume_ratio" } } },
    ]);

    const [usersToday, successTx, failedTx, pendingTx, gbToday, gbMonth] = await Promise.all([
      User.countDocuments({ userType: { $ne: "admin" }, createdAt: { $gte: startOfToday } }),
      Transaction.countDocuments({ trans_Status: "success" }),
      Transaction.countDocuments({ trans_Status: "failed" }),
      Transaction.countDocuments({ trans_Status: "processing" }),
      gbAgg(startOfToday),
      gbAgg(startOfMonth),
    ]);

    res.status(200).json({
      usersToday,
      successTx,
      failedTx,
      pendingTx,
      gbSoldToday: gbToday[0]?.gb || 0,
      gbSoldThisMonth: gbMonth[0]?.gb || 0,
    });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getProfitAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOf = (daysAgo) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const profitFor = async (from, to) => {
      const result = await Transaction.aggregate([
        { $match: { trans_Status: "success", createdAt: { $gte: from, $lte: to || now } } },
        { $group: { _id: null, profit: { $sum: "$trans_profit" }, volume: { $sum: "$trans_amount" }, count: { $sum: 1 } } },
      ]);
      return result[0] || { profit: 0, volume: 0, count: 0 };
    };

    const todayStart = startOf(0);
    const yesterdayStart = startOf(1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // last 30 days broken down per day for the chart
    const dailyBreakdown = await Transaction.aggregate([
      { $match: { trans_Status: "success", createdAt: { $gte: startOf(29) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } } },
          profit: { $sum: "$trans_profit" },
          volume: { $sum: "$trans_amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // today broken down per hour (0–23 UTC) for the hourly chart
    const hourlyBreakdown = await Transaction.aggregate([
      { $match: { trans_Status: "success", createdAt: { $gte: todayStart } } },
      {
        $group: {
          _id: { $hour: { $toDate: "$createdAt" } },
          profit: { $sum: "$trans_profit" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // yesterday broken down per hour
    const hourlyBreakdownYesterday = await Transaction.aggregate([
      { $match: { trans_Status: "success", createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
      {
        $group: {
          _id: { $hour: { $toDate: "$createdAt" } },
          profit: { $sum: "$trans_profit" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // all time broken down per month
    const monthlyBreakdown = await Transaction.aggregate([
      { $match: { trans_Status: "success" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: { $toDate: "$createdAt" } } },
          profit: { $sum: "$trans_profit" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const [today, yesterday, days7, thisMonth, allTime] = await Promise.all([
      profitFor(todayStart),
      profitFor(yesterdayStart, todayStart),
      profitFor(startOf(7)),
      profitFor(thisMonthStart),
      profitFor(new Date(0)),
    ]);

    res.status(200).json({
      today, yesterday, days7, thisMonth, allTime,
      dailyBreakdown, hourlyBreakdown, hourlyBreakdownYesterday, monthlyBreakdown,
    });
  } catch (e) {
    console.error("[getProfitAnalytics]", e.message);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

// ─── Broadcasts ───────────────────────────────────────────────────────────────
const createBroadcast = async (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ msg: "title and message required" });
  try {
    const broadcast = await Broadcast.create({ title, message, type: type || "info" });
    res.status(201).json({ msg: "Broadcast created", broadcast });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find().sort({ createdAt: -1 });
    res.status(200).json({ broadcasts });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getActiveBroadcasts = async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ broadcasts });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const toggleBroadcast = async (req, res) => {
  const { id } = req.params;
  try {
    const b = await Broadcast.findById(id);
    if (!b) return res.status(404).json({ msg: "Broadcast not found" });
    b.isActive = !b.isActive;
    await b.save();
    res.status(200).json({ msg: `Broadcast ${b.isActive ? "activated" : "deactivated"}`, isActive: b.isActive });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const deleteBroadcast = async (req, res) => {
  const { id } = req.params;
  try {
    await Broadcast.findByIdAndDelete(id);
    res.status(200).json({ msg: "Broadcast deleted" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const resetUserPin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    await User.updateOne({ _id: id }, { $unset: { transactionPin: 1 }, $set: { pinEnabled: false } });
    res.status(200).json({ msg: `Transaction PIN cleared for ${user.userName}` });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6)
    return res.status(400).json({ msg: "Password must be at least 6 characters" });
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await User.updateOne({ _id: id }, { password: hashed, $unset: { resetToken: 1, resetTokenExpiry: 1 } });
    res.status(200).json({ msg: `Password reset for ${user.userName}` });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getMainPlatformBalance = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    if (!settings.mainPlatformUrl || !settings.mainPlatformApiKey)
      return res.status(200).json({ balance: null, error: "Main platform not configured" });
    const { data } = await axios.get(`${settings.mainPlatformUrl}/user`, {
      headers: { Authorization: `Bearer ${settings.mainPlatformApiKey}` },
    });
    const balance = data?.balance ?? data?.wallet ?? data?.data?.balance ?? data?.user?.balance ?? null;
    res.status(200).json({ balance });
  } catch (e) {
    res.status(200).json({ balance: null, error: "Failed to fetch platform balance" });
  }
};

module.exports = {
  getUsers, getUserById, updateUser, creditUser, debitUser, setSpecialPricing,
  getTransactions, refundTransaction,
  getAdminPlans, updatePlanPrice, syncPlans,
  generateCoupon, listCoupons,
  getNotifications, markNotificationsRead, getUnreadCount,
  getSettings, updateSettings,
  getDashboardSummary,
  getProfitAnalytics,
  createBroadcast, getBroadcasts, getActiveBroadcasts, toggleBroadcast, deleteBroadcast,
  getPublicTheme,
  resetUserPin, resetUserPassword,
  getMainPlatformBalance,
};
