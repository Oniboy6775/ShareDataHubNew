const mongoose = require("mongoose");

const guestPendingOrderSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  serviceType: { type: String, enum: ["data", "airtime", "electricity"], required: true },
  servicePayload: { type: mongoose.Schema.Types.Mixed, required: true },
  totalAmount: { type: Number, required: true },
  guestBalanceUsed: { type: Number, default: 0 },
  monnifyAmount: { type: Number, default: 0 },
  monnifyReference: { type: String, default: "" },
  monnifyAccountNumber: { type: String, default: "" },
  monnifyBankName: { type: String, default: "" },
  status: { type: String, enum: ["pending", "completed", "failed", "expired"], default: "pending" },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expires: 0 } },
});

module.exports = mongoose.model("GuestPendingOrder", guestPendingOrderSchema);
