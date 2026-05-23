const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  registrationBonus: { type: Number, default: 0 },
  commissionPerPlan: [{ planId: Number, amount: Number }],
  mainPlatformApiKey: { type: String, default: "" },
  mainPlatformUrl: { type: String, default: "" },
  // Theme overrides — empty string means "use the default from theme.config.js"
  themeSiteName:      { type: String, default: "" },
  themeLogoUrl:       { type: String, default: "" },
  themeSupportPhone:  { type: String, default: "" },
  themeChannelLink:   { type: String, default: "" },
  themePrimary:       { type: String, default: "" },
  themeSecondary:     { type: String, default: "" },
  themeDark:          { type: String, default: "" },
  themeDarker:        { type: String, default: "" },
  themeLight:         { type: String, default: "" },
  // SMTP — override env vars when set
  smtpHost:  { type: String, default: "" },
  smtpPort:  { type: Number, default: 0 },
  smtpUser:  { type: String, default: "" },
  smtpPass:  { type: String, default: "" },
  smtpFrom:  { type: String, default: "" },
  // Payment credentials — override env vars when set
  monnifyApiKey:      { type: String, default: "" },
  monnifySecretKey:   { type: String, default: "" },
  monnifyContractCode:{ type: String, default: "" },
  monnifyBaseUrl:     { type: String, default: "" },
  frontendUrl:        { type: String, default: "" },
  googleFormUrl:      { type: String, default: "" },
  // BillStack virtual accounts
  billstackApi:       { type: String, default: "" },
  billstackSecret:    { type: String, default: "" },
  billstackBanks:     { type: String, default: "PALMPAY,MONIEPOINT,WEMA" },
});

settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

module.exports = mongoose.model("Setting", settingsSchema);
