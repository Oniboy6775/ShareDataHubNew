const nodemailer = require("nodemailer");
const Settings = require("../Models/settingsModel");

const sendEmail = async ({ to, subject, html }) => {
  const s = await Settings.getSingleton();

  const host = s.smtpHost || process.env.SMTP_HOST;
  const port = s.smtpPort || Number(process.env.SMTP_PORT) || 587;
  const user = s.smtpUser || process.env.SMTP_USER;
  const pass = s.smtpPass || process.env.SMTP_PASS;
  const from = s.smtpFrom || process.env.SMTP_FROM || user;

  if (!host || !user || !pass)
    throw new Error("SMTP not configured. Set SMTP credentials in Admin → Settings.");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, html });
};

module.exports = sendEmail;
