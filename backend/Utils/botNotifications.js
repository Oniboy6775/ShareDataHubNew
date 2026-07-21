const Settings = require("../Models/settingsModel");

const getBotNotification = async (trigger) => {
  const settings = await Settings.getSingleton();
  const entry = settings.botNotifications?.[trigger];
  if (entry?.enabled && entry?.message?.trim()) {
    return `\n\n─────────────────\n${entry.message.trim()}`;
  }
  return "";
};

module.exports = { getBotNotification };
