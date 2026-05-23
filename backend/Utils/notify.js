const Notification = require("../Models/notificationModel");

const notify = async ({ title, body, type, userId }) => {
  try {
    await Notification.create({ title, body, type, userId });
  } catch (e) {
    console.error("[notify] failed:", e.message);
  }
};

module.exports = notify;
