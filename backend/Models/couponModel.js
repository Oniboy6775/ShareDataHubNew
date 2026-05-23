const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: { type: String, required: true, unique: true },
  couponOwner: { type: String, default: "" },
  amount: { type: Number, required: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: { expires: '180d' } },
});

module.exports = mongoose.model("Coupon", couponSchema);
