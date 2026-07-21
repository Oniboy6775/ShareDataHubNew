const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide valid email",
    },
    unique: true,
    lowercase: true,
  },
  password: { type: String, required: [true, "enter a password"] },
  userName: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  phoneNumber: { type: String, required: true, trim: true },
  userType: {
    type: String,
    enum: ["user", "reseller", "api user", "agent", "admin"],
    default: "user",
  },
  balance: { type: Number, default: 0 },
  earningBalance: { type: Number, default: 0 },
  apiToken: { type: String },
  referredBy: { type: String, lowercase: true },
  referrals: [
    {
      userName: String,
      email: String,
      amountEarn: { type: Number, default: 0 },
    },
  ],
  bvn: { type: String },
  nin: { type: String },
  webhookUrl: { type: String, default: "" },
  webhookUrls: [{ type: String }],
  accountNumbers: [{ bankName: String, accountNumber: String }],
  isSpecial: { type: Boolean, default: false },
  specialPrices: [{ planId: Number, price: Number }],
  transactionPin: { type: String },
  pinEnabled: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  whatsappNumber: { type: String },
  whatsappLinkCode: { type: String },
  whatsappLinkCodeExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.createJWT = function () {
  return jwt.sign(
    { userId: this._id, userType: this.userType },
    process.env.JWT_SECRET,
    { expiresIn: "30d" },
  );
};

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
