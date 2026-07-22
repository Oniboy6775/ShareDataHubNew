const express = require("express");
const router = express.Router();
const Settings = require("../Models/settingsModel");
const GuestPendingOrder = require("../Models/GuestPendingOrder");
const {
  fulfillGuestOrder,
} = require("../Controllers/whatsappGuestOrderHelper");
const { handleMessage } = require("../Controllers/whatsappBotController");

// Meta verification handshake
router.get("/webhook", async (req, res) => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  try {
    const settings = await Settings.getSingleton();
    if (mode === "subscribe" && verifyToken === settings.whatsappVerifyToken) {
      return res.send(challenge);
    }
    return res.sendStatus(403);
  } catch (e) {
    return res.sendStatus(403);
  }
});

// Incoming WhatsApp messages
router.post("/webhook", (req, res) => {
  res.sendStatus(200); // Meta requires a 200 within 5 seconds
  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value) return;
    if (value.statuses) return; // delivery/read status update — nothing to process

    const message = value.messages?.[0];
    if (!message) return;

    const from = message.from;
    const messageType = message.type;
    const buttonId =
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id ||
      null;
    const messageBody =
      message.text?.body ||
      message.interactive?.button_reply?.title ||
      message.interactive?.list_reply?.title ||
      "";
    const profileName = value.contacts?.[0]?.profile?.name || "";

    handleMessage(from, messageBody, messageType, buttonId, profileName).catch(
      (e) => console.error("[whatsapp handleMessage]", e.message),
    );
  } catch (e) {
    console.error("[whatsapp webhook]", e.message);
  }
});

// Monnify webhook — fulfills guest orders paid by real bank transfer.
// (No standalone wallet top-up exists — guests only pay via Monnify at
// purchase time, so every SUCCESSFUL_TRANSACTION here must match a
// GuestPendingOrder or there's nothing to do.)
router.post("/monnify-webhook", (req, res) => {
  res.sendStatus(200);
  (async () => {
    try {
      const { eventType, eventData } = req.body || {};
      if (
        eventType !== "SUCCESSFUL_TRANSACTION" ||
        !eventData?.paymentReference
      )
        return;

      const order = await GuestPendingOrder.findOne({
        monnifyReference: eventData.paymentReference,
      });
      if (order && order.status === "pending") {
        await fulfillGuestOrder(order, eventData.settlementAmount);
      }
    } catch (e) {
      console.error("[monnify-webhook]", e.message);
    }
  })();
});

module.exports = router;
