const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ["transaction", "registration", "funding", "failed", "refund"],
    default: "transaction",
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: { expires: '60d' } },
});

module.exports = mongoose.model("Notification", notificationSchema);
