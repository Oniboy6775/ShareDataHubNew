const jwt = require("jsonwebtoken");
const GuestUser = require("../Models/GuestUser");
const GuestPendingOrder = require("../Models/GuestPendingOrder");
const User = require("../Models/userModel");
const Settings = require("../Models/settingsModel");
const { initiateGuestMonnifyPayment } = require("../Utils/monnifyPayment");
const { sendWhatsAppMessage, apiCall } = require("../Utils/whatsappHelper");
const { getBotNotification } = require("../Utils/botNotifications");

const ENDPOINT_BY_TYPE = {
  data: "/buy/data",
  airtime: "/buy/airtime",
  electricity: "/buy/electricity",
};

const getBotWallet = async () => {
  const cfg = await Settings.getSingleton();
  if (!cfg.botWalletUserId) return null;
  return User.findById(cfg.botWalletUserId);
};

const getBotToken = async () => {
  const bot = await getBotWallet();
  if (!bot) throw new Error("Bot wallet is not configured. Contact admin.");
  return jwt.sign(
    { userId: bot._id, userType: bot.userType },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};

// initiateGuestPayment NEVER moves money — it only creates the pending order
// and asks the guest to pay/confirm. All balance movement happens in
// fulfillGuestOrder, so there is exactly one place money can move.
const initiateGuestPayment = async (
  to,
  session,
  guest,
  serviceType,
  payload,
  totalAmount,
) => {
  const guestBalanceUsed = Math.min(guest.balance, totalAmount);
  const monnifyAmount = totalAmount - guestBalanceUsed;

  if (monnifyAmount === 0) {
    // Guest already confirmed by tapping "Confirm Purchase" one step earlier —
    // asking them to reply CONFIRM again here was a redundant second prompt,
    // so process immediately instead of parking in AWAITING_PAYMENT.
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
    session.state = "IDLE";
    session.context = {};
    await session.save();
    await sendWhatsAppMessage(
      to,
      "⏳ Your wallet balance covers this purchase — processing now...",
    );
    await fulfillGuestOrder(order, 0);
    return;
  }

  const guestEmail = `${to}@gmail.com`;
  let paymentReference, accountNumber, bankName;
  try {
    ({ paymentReference, accountNumber, bankName } =
      await initiateGuestMonnifyPayment(
        monnifyAmount,
        guestEmail,
        guest.profileName || to,
      ));
  } catch (e) {
    console.error(
      `[initiateGuestPayment] Monnify init failed at step [${e.monnifyStep || "unknown"}]:`,
      e?.response?.data || e.message,
    );
    await sendWhatsAppMessage(
      to,
      "❌ Unable to generate a payment account right now. Please try again in a moment, or type *MENU* to start over.",
    );
    return;
  }

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
  if (guestBalanceUsed > 0)
    msg += `Wallet balance used: ₦${guestBalanceUsed.toLocaleString()}\n`;
  msg += `Amount to pay: ₦${monnifyAmount.toLocaleString()}\nBank: ${bankName}\nAccount Number: ${accountNumber}\n\nReply *PAID* once payment is confirmed or *CANCEL* to abort.`;
  await sendWhatsAppMessage(to, msg);
};

// NOTE: any Monnify settlement already credited to the bot wallet is NOT
// reversed here — that cash genuinely arrived and stays in the bot wallet's
// shared float pool. The guest is refunded via their own ledger instead,
// which they can spend against that same pool on a future attempt.
const _failOrder = async (order, guest, linkedUser, reason) => {
  try {
    if (guest) {
      await GuestUser.updateOne(
        { _id: guest._id },
        { $inc: { balance: order.totalAmount } },
      );
    } else if (linkedUser) {
      await User.updateOne(
        { _id: linkedUser._id },
        { $inc: { balance: order.totalAmount } },
      );
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
  // Atomic claim — the webhook and the guest's own "PAID" active-check can
  // both try to fulfill the same order around the same time. Whichever call
  // wins this update proceeds; the other sees it's no longer "pending" and
  // backs off, so the bot wallet is never credited twice for one order.
  const claimed = await GuestPendingOrder.findOneAndUpdate(
    { _id: order._id, status: "pending" },
    { $set: { status: "processing" } },
    { new: true },
  );
  if (!claimed) return;
  order = claimed;

  const guest = await GuestUser.findOne({ phoneNumber: order.phoneNumber });
  const linkedUser = !guest
    ? await User.findOne({ whatsappNumber: order.phoneNumber })
    : null;
  const botUser = await getBotWallet();

  if (!botUser) {
    console.error("[fulfillGuestOrder] bot wallet not configured");
    // Put it back so a later retry (guest's next PAID reply) can pick it up
    // once the admin configures botWalletUserId.
    order.status = "pending";
    await order.save();
    return;
  }

  try {
    if (order.guestBalanceUsed > 0) {
      const target = guest ? GuestUser : User;
      await target.updateOne(
        { _id: (guest || linkedUser)._id },
        { $inc: { balance: -order.guestBalanceUsed } },
      );
      // NOT re-credited to the bot wallet — that cash already entered the
      // shared pool whenever this guest balance was originally earned
      // (e.g. a refund from an earlier failed order), so crediting it again
      // here would double-count real money that never moved just now.
    }

    if (order.monnifyAmount > 0) {
      // Fresh real money for THIS purchase settles into the bot wallet's
      // shared pool now, net of Monnify's own transaction charge — using
      // whatever settlementAmount was actually reported (real webhook value,
      // or the admin-configured charge estimate from an active PAID check).
      const credited = settlementAmount || order.monnifyAmount;
      await User.updateOne({ _id: botUser._id }, { $inc: { balance: credited } });
    }

    const token = await getBotToken();
    const result = await apiCall(
      "POST",
      ENDPOINT_BY_TYPE[order.serviceType],
      order.servicePayload,
      token,
    );

    order.status = "completed";
    order.processedAt = new Date();
    await order.save();

    let freshBalance = 0;
    if (guest)
      freshBalance = (await GuestUser.findById(guest._id))?.balance ?? 0;
    else if (linkedUser)
      freshBalance = (await User.findById(linkedUser._id))?.balance ?? 0;

    const suffix = await getBotNotification(
      guest ? "guestPurchaseSuccess" : "registeredPurchaseSuccess",
    );
    await sendWhatsAppMessage(
      order.phoneNumber,
      `✅ ${result?.msg || "Purchase successful!"}\n\nBalance: ₦${freshBalance.toLocaleString()}${suffix}`,
    );
  } catch (err) {
    console.error("[fulfillGuestOrder]", err?.response?.data || err.message);
    await _failOrder(
      order,
      guest,
      linkedUser,
      err?.response?.data?.msg || err.message,
    );
  }
};

module.exports = {
  getBotWallet,
  getBotToken,
  initiateGuestPayment,
  fulfillGuestOrder,
  _failOrder,
};
