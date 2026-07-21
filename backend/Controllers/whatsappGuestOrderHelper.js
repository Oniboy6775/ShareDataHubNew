const jwt = require("jsonwebtoken");
const GuestUser = require("../Models/GuestUser");
const GuestPendingOrder = require("../Models/GuestPendingOrder");
const User = require("../Models/userModel");
const Settings = require("../Models/settingsModel");
const { initiateGuestMonnifyPayment } = require("../Utils/monnifyPayment");
const { sendWhatsAppMessage, apiCall } = require("../Utils/whatsappHelper");
const { getBotNotification } = require("../Utils/botNotifications");

const ENDPOINT_BY_TYPE = { data: "/buy/data", airtime: "/buy/airtime", electricity: "/buy/electricity" };

const getBotWallet = async () => {
  const cfg = await Settings.getSingleton();
  if (!cfg.botWalletUserId) return null;
  return User.findById(cfg.botWalletUserId);
};

const getBotToken = async () => {
  const bot = await getBotWallet();
  if (!bot) throw new Error("Bot wallet is not configured. Contact admin.");
  return jwt.sign({ userId: bot._id, userType: bot.userType }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

// initiateGuestPayment NEVER moves money — it only creates the pending order
// and asks the guest to pay/confirm. All balance movement happens in
// fulfillGuestOrder, so there is exactly one place money can move.
const initiateGuestPayment = async (to, session, guest, serviceType, payload, totalAmount) => {
  const guestBalanceUsed = Math.min(guest.balance, totalAmount);
  const monnifyAmount = totalAmount - guestBalanceUsed;

  if (monnifyAmount === 0) {
    const order = await GuestPendingOrder.create({
      phoneNumber: to,
      serviceType,
      servicePayload: payload,
      totalAmount,
      guestBalanceUsed,
      monnifyAmount: 0,
      status: "pending",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    session.state = "AWAITING_PAYMENT";
    session.context.orderId = order._id.toString();
    session.markModified("context");
    await session.save();
    await sendWhatsAppMessage(to, "✅ Your wallet balance covers this purchase.\n\nReply *CONFIRM* to proceed or *CANCEL* to abort.");
    return;
  }

  const guestEmail = `${to}@bot.guest`;
  const { paymentReference, accountNumber, bankName } = await initiateGuestMonnifyPayment(
    monnifyAmount,
    guestEmail,
    guest.profileName || to,
  );

  const order = await GuestPendingOrder.create({
    phoneNumber: to,
    serviceType,
    servicePayload: payload,
    totalAmount,
    guestBalanceUsed,
    monnifyAmount,
    monnifyReference: paymentReference,
    monnifyAccountNumber: accountNumber,
    monnifyBankName: bankName,
    status: "pending",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  session.state = "AWAITING_PAYMENT";
  session.context.orderId = order._id.toString();
  session.markModified("context");
  await session.save();

  let msg = "💳 *Complete Your Payment*\n\n";
  if (guestBalanceUsed > 0) msg += `Wallet balance used: ₦${guestBalanceUsed.toLocaleString()}\n`;
  msg += `Amount to pay: ₦${monnifyAmount.toLocaleString()}\nBank: ${bankName}\nAccount Number: ${accountNumber}\n\nReply *PAID* once payment is confirmed or *CANCEL* to abort.`;
  await sendWhatsAppMessage(to, msg);
};

const _failOrder = async (order, guest, linkedUser, botUser, reason) => {
  try {
    if (order.guestBalanceUsed > 0 && botUser) {
      await User.updateOne({ _id: botUser._id }, { $inc: { balance: -order.guestBalanceUsed } });
    }
    if (guest) {
      await GuestUser.updateOne({ _id: guest._id }, { $inc: { balance: order.totalAmount } });
    } else if (linkedUser) {
      await User.updateOne({ _id: linkedUser._id }, { $inc: { balance: order.totalAmount } });
    }
    order.status = "failed";
    order.processedAt = new Date();
    await order.save();
    await sendWhatsAppMessage(
      order.phoneNumber,
      `❌ Purchase failed: ${reason || "Unknown error"}.\n\nYour ₦${order.totalAmount.toLocaleString()} has been refunded to your wallet.`,
    );
  } catch (e) {
    console.error("[_failOrder]", e.message);
  }
};

const fulfillGuestOrder = async (order, settlementAmount) => {
  if (order.status !== "pending") return;

  const guest = await GuestUser.findOne({ phoneNumber: order.phoneNumber });
  const linkedUser = !guest ? await User.findOne({ whatsappNumber: order.phoneNumber }) : null;
  const botUser = await getBotWallet();

  if (!botUser) {
    console.error("[fulfillGuestOrder] bot wallet not configured");
    return;
  }

  try {
    if (order.guestBalanceUsed > 0) {
      if (guest) {
        await GuestUser.updateOne({ _id: guest._id }, { $inc: { balance: -order.guestBalanceUsed } });
      } else if (linkedUser) {
        await User.updateOne({ _id: linkedUser._id }, { $inc: { balance: -order.guestBalanceUsed } });
      }
      await User.updateOne({ _id: botUser._id }, { $inc: { balance: order.guestBalanceUsed } });
    }

    const token = await getBotToken();
    const result = await apiCall("POST", ENDPOINT_BY_TYPE[order.serviceType], order.servicePayload, token);

    order.status = "completed";
    order.processedAt = new Date();
    await order.save();

    let freshBalance = 0;
    if (guest) freshBalance = (await GuestUser.findById(guest._id))?.balance ?? 0;
    else if (linkedUser) freshBalance = (await User.findById(linkedUser._id))?.balance ?? 0;

    const suffix = await getBotNotification(guest ? "guestPurchaseSuccess" : "registeredPurchaseSuccess");
    await sendWhatsAppMessage(
      order.phoneNumber,
      `✅ ${result?.msg || "Purchase successful!"}\n\nBalance: ₦${freshBalance.toLocaleString()}${suffix}`,
    );
  } catch (err) {
    console.error("[fulfillGuestOrder]", err?.response?.data || err.message);
    await _failOrder(order, guest, linkedUser, botUser, err?.response?.data?.msg || err.message);
  }
};

module.exports = { getBotWallet, getBotToken, initiateGuestPayment, fulfillGuestOrder, _failOrder };
