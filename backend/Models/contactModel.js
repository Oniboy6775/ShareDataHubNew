const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:   { type: String, default: "" },
  phone:  { type: String, required: true },
  lastUsed: { type: Date, default: Date.now },
});

// Auto-delete 30 days after lastUsed
contactSchema.index({ lastUsed: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
contactSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);
