const axios = require("axios");
const Settings = require("../Models/settingsModel");

const PORT = process.env.PORT || 5001;

// Internal call to this same backend's own /api/v1 routes (used by the bot
// to reuse the existing purchase/auth logic instead of duplicating it).
const apiCall = async (method, path, data, token) => {
  const { data: res } = await axios({
    method,
    url: `http://localhost:${PORT}/api/v1${path}`,
    data,
    headers: token ? { "x-auth-token": token } : {},
  });
  return res;
};

const graphClient = async () => {
  const cfg = await Settings.getSingleton();
  return {
    token: cfg.whatsappBotToken || process.env.WHATSAPP_BOT_TOKEN || "",
    phoneId: cfg.whatsappPhoneId || process.env.WHATSAPP_PHONE_ID || "",
  };
};

const sendWhatsAppMessage = async (to, text) => {
  const { token, phoneId } = await graphClient();
  return axios
    .post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .catch((err) => console.error("[sendWhatsAppMessage]", err?.response?.data || err.message));
};

const sendWhatsAppButtons = async (to, bodyText, buttons = []) => {
  const { token, phoneId } = await graphClient();
  return axios
    .post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: {
            buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title } })),
          },
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .catch((err) => console.error("[sendWhatsAppButtons]", err?.response?.data || err.message));
};

const sendWhatsAppList = async (to, bodyText, buttonLabel, sections = []) => {
  const { token, phoneId } = await graphClient();
  return axios
    .post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: bodyText },
          action: { button: buttonLabel, sections },
        },
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    .catch((err) => console.error("[sendWhatsAppList]", err?.response?.data || err.message));
};

module.exports = { sendWhatsAppMessage, sendWhatsAppButtons, sendWhatsAppList, apiCall };
