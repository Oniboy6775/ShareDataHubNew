const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: "GuestUser", default: null },
  // Not enum-constrained on purpose — the bot controller owns the state list
  // (IDLE, DATA_PHONE, DATA_CATEGORY, ..., AWAITING_PAYMENT, LINK_CODE, etc.)
  state: { type: String, default: "IDLE" },
  context: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now, index: { expires: 1800 } },
});

module.exports = mongoose.model("Conversation", conversationSchema);
