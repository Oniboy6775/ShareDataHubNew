const express = require("express");
const router = express.Router();
const Settings = require("../Models/settingsModel");
const GuestPendingOrder = require("../Models/GuestPendingOrder");
const Conversation = require("../Models/Conversation");
const GuestUser = require("../Models/GuestUser");
const { sendWhatsAppMessage } = require("../Utils/whatsappHelper");
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

// Monnify webhook — fulfills guest orders and wallet top-ups
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

      const reference = eventData.paymentReference;
      const settlementAmount = eventData.settlementAmount;

      const order = await GuestPendingOrder.findOne({
        monnifyReference: reference,
      });
      if (order) {
        if (order.status === "pending")
          await fulfillGuestOrder(order, settlementAmount);
        return;
      }

      // No matching order — check if this is a wallet top-up
      const session = await Conversation.findOne({
        "context.topupRef": reference,
      });
      if (!session) return;
      const guest = await GuestUser.findOneAndUpdate(
        { phoneNumber: session.phoneNumber },
        { $inc: { balance: settlementAmount } },
        { new: true },
      );
      if (!guest) return;
      session.context.topupRef = null;
      session.markModified("context");
      await session.save();
      await sendWhatsAppMessage(
        session.phoneNumber,
        `✅ Wallet funded with ₦${settlementAmount.toLocaleString()}.\n\nNew balance: ₦${guest.balance.toLocaleString()}`,
      );
    } catch (e) {
      console.error("[monnify-webhook]", e.message);
    }
  })();
});

module.exports = router;
