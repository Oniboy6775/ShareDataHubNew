const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  trans_Id: { type: String, required: true, unique: true },
  trans_By: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  trans_UserName: { type: String },
  trans_Type: { type: String },
  trans_plan: { type: String, default: "" },
  trans_Network: { type: String },
  phone_number: { type: String },
  trans_amount: { type: Number },
  balance_Before: { type: Number },
  balance_After: { type: Number },
  trans_Status: { type: String, default: "pending" },
  trans_profit: { type: Number, default: 0 },
  trans_volume_ratio: { type: Number, default: 0 },
  apiResponse: { type: String, default: "" },
  apiResponseId: { type: String, default: "" },
  trans_supplier: { type: String, default: "" },
  trans_Date: { type: String },
  createdAt: { type: Date, default: Date.now, index: { expires: '90d' } },
});

module.exports = mongoose.model("Transaction", transactionSchema);
