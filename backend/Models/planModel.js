const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  planId: { type: Number, required: true, unique: true },
  network: { type: String },
  planName: { type: String },
  planType: { type: String },
  planCategory: { type: String, default: "" },
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  resellerPrice: { type: Number, default: 0 },
  apiPrice: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isHot: { type: Boolean, default: false },
});

module.exports = mongoose.model("Plan", planSchema);
