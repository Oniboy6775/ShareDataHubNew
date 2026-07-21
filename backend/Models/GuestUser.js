const mongoose = require("mongoose");

const guestUserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  profileName: { type: String, default: "" },
  balance: { type: Number, default: 0 },
  lastInteractedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GuestUser", guestUserSchema);
