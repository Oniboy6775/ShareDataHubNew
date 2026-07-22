const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Conversation = require("../Models/Conversation");
const GuestUser = require("../Models/GuestUser");
const GuestPendingOrder = require("../Models/GuestPendingOrder");
const User = require("../Models/userModel");
const Plan = require("../Models/planModel");
const Settings = require("../Models/settingsModel");
const { sendWhatsAppMessage, sendWhatsAppButtons, sendWhatsAppList, apiCall } = require("../Utils/whatsappHelper");
const { getBotNotification } = require("../Utils/botNotifications");
const { checkMonnifyPaymentStatus } = require("../Utils/monnifyPayment");
const { initiateGuestPayment, fulfillGuestOrder, getBotToken } = require("./whatsappGuestOrderHelper");

const NETWORKS = ["MTN", "AIRTEL", "GLO", "9MOBILE"];

const resolvePrice = (plan, user) => {
  if (user?.isSpecial && user.specialPrices?.length) {
    const sp = user.specialPrices.find((s) => s.planId === plan.planId);
    if (sp?.price) return sp.price;
  }
  if (user?.userType === "reseller" && plan.resellerPrice) return plan.resellerPrice;
  if (user?.userType === "api user" && plan.apiPrice) return plan.apiPrice;
  return plan.sellingPrice;
};

// ── Session / participant helpers ──────────────────────────────────────────

const getOrCreateSession = async (phoneNumber) => {
  return Conversation.findOneAndUpdate(
    { phoneNumber },
    { $setOnInsert: { phoneNumber, state: "IDLE", context: {} }, $set: { updatedAt: new Date() } },
    { upsert: true, new: true },
  );
};

const getParticipant = async (session) => {
  if (session.userId) {
    const user = await User.findById(session.userId);
    if (user) return { type: "registered", user };
  }
  if (session.guestId) {
    const guest = await GuestUser.findById(session.guestId);
    if (guest) return { type: "guest", guest };
  }
  return { type: "none" };
};

const ensureGuest = async (session, phoneNumber, profileName) => {
  const guest = await GuestUser.findOneAndUpdate(
    { phoneNumber },
    { $setOnInsert: { phoneNumber }, $set: { profileName: profileName || "", lastInteractedAt: new Date() } },
    { upsert: true, new: true },
  );
  session.guestId = guest._id;
  await session.save();
  return guest;
};

const resetToIdle = async (session) => {
  session.state = "IDLE";
  session.context = {};
  await session.save();
};

// ── Main menu / account handlers ────────────────────────────────────────────

const sendMainMenu = async (to, session, participant) => {
  const accountRows = [
    { id: "CHECK_BAL", title: "💰 Check Balance", description: "" },
    { id: "MY_TRANS", title: "📋 My Transactions", description: "" },
  ];
  if (participant.type === "guest") {
    // Guests can only pay via Monnify at purchase time — there's no
    // standalone wallet top-up right now, so no Fund Wallet menu entry.
    accountRows.push({ id: "LINK_ACCOUNT", title: "🔗 Link Account", description: "" });
  } else if (participant.type === "registered") {
    accountRows.push({ id: "UNLINK_ACCOUNT", title: "🔓 Unlink Account", description: "" });
  }

  const sections = [
    {
      title: "Services",
      rows: [
        { id: "BUY_DATA", title: "📦 Buy Data", description: "" },
        { id: "BUY_AIRTIME", title: "📱 Buy Airtime", description: "" },
        { id: "BUY_ELEC", title: "💡 Buy Electricity", description: "" },
      ],
    },
    { title: "Account", rows: accountRows },
  ];

  const suffix = await getBotNotification(participant.type === "guest" ? "guestMainMenu" : "registeredMainMenu");
  const name = participant.type === "registered" ? participant.user.userName : participant.guest?.profileName || "there";
  await sendWhatsAppList(to, `👋 Hi ${name}!\n\nWhat would you like to do today?${suffix}`, "View Options", sections);
};

const handleBalance = async (to, participant) => {
  if (participant.type === "registered") {
    const user = await User.findById(participant.user._id);
    const suffix = await getBotNotification("registeredBalanceCheck");
    await sendWhatsAppMessage(to, `💰 Your balance: ₦${user.balance.toLocaleString()}${suffix}`);
  } else if (participant.type === "guest") {
    const guest = participant.guest;
    const suffix = await getBotNotification("guestBalanceCheck");
    let msg = `💰 Your guest wallet balance: ₦${guest.balance.toLocaleString()}${suffix}`;
    if (!guest.balance) msg += `\n\nTip: select *Fund Wallet* from the menu to top up.`;
    await sendWhatsAppMessage(to, msg);
  }
};

const handleTransactions = async (to, participant) => {
  if (participant.type === "registered") {
    const token = jwt.sign(
      { userId: participant.user._id, userType: participant.user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    try {
      const result = await apiCall("GET", "/auth/transactions?limit=5", null, token);
      const txns = result?.transactions || [];
      if (!txns.length) return sendWhatsAppMessage(to, "You have no transactions yet.");
      const lines = txns
        .slice(0, 5)
        .map((t) => `• ${(t.trans_Type || "").toUpperCase()} — ₦${t.trans_amount} — ${t.trans_Status}`)
        .join("\n");
      await sendWhatsAppMessage(to, `📋 *Last ${Math.min(txns.length, 5)} Transactions*\n\n${lines}`);
    } catch (e) {
      await sendWhatsAppMessage(to, "Unable to fetch transactions right now.");
    }
  } else if (participant.type === "guest") {
    const orders = await GuestPendingOrder.find({ phoneNumber: to }).sort({ createdAt: -1 }).limit(5);
    if (!orders.length) return sendWhatsAppMessage(to, "You have no transactions yet.");
    const lines = orders.map((o) => `• ${o.serviceType.toUpperCase()} — ₦${o.totalAmount} — ${o.status}`).join("\n");
    await sendWhatsAppMessage(to, `📋 *Last ${orders.length} Orders*\n\n${lines}`);
  }
};

// ── Data purchase flow ──────────────────────────────────────────────────────

const handleDataPhone = async (to, session) => {
  session.state = "DATA_PHONE";
  session.context = {};
  await session.save();
  await sendWhatsAppMessage(to, "📦 Enter the phone number to receive data:");
};

const handleDataPhoneInput = async (to, session, input) => {
  const phone = input.replace(/\D/g, "");
  if (!/^0\d{10}$/.test(phone)) return sendWhatsAppMessage(to, "Please enter a valid 11-digit phone number (e.g. 08012345678):");

  session.context.phone = phone;
  session.state = "DATA_NETWORK";
  session.markModified("context");
  await session.save();

  await sendWhatsAppList(to, "Select network:", "Choose Network", [
    {
      title: "Networks",
      rows: NETWORKS.map((n) => ({ id: n, title: n === "9MOBILE" ? "9mobile" : n.charAt(0) + n.slice(1).toLowerCase(), description: "" })),
    },
  ]);
};

const handleDataNetwork = async (to, session, networkId) => {
  if (!NETWORKS.includes(networkId)) return sendWhatsAppMessage(to, "Invalid network. Type MENU to start over.");

  const plans = await Plan.find({ botEnabled: true, isAvailable: true, network: networkId });
  if (!plans.length) {
    await resetToIdle(session);
    return sendWhatsAppMessage(to, `No ${networkId} data plans are available right now. Please try again later.`);
  }
  const categories = [...new Set(plans.map((p) => p.planCategory || "Other"))];

  session.context.network = networkId;
  session.context.categories = categories;
  session.state = "DATA_CATEGORY";
  session.markModified("context");
  await session.save();

  if (categories.length <= 3) {
    await sendWhatsAppButtons(
      to,
      `Choose a ${networkId} data category:`,
      categories.map((c, i) => ({ id: `CAT_${i}`, title: c })),
    );
  } else {
    await sendWhatsAppList(to, `Choose a ${networkId} data category:`, "View Categories", [
      { title: "Categories", rows: categories.slice(0, 10).map((c, i) => ({ id: `CAT_${i}`, title: c, description: "" })) },
    ]);
  }
};

const handleDataCategory = async (to, session, categoryId) => {
  const idx = parseInt(String(categoryId).replace(/^CAT_/i, ""), 10);
  const categories = session.context?.categories || [];
  const category = categories[idx];
  if (category === undefined) return sendWhatsAppMessage(to, "Invalid selection. Type MENU to start over.");

  const plans = await Plan.find({ botEnabled: true, isAvailable: true, planCategory: category, network: session.context.network })
    .sort({ sellingPrice: 1 })
    .limit(10);
  if (!plans.length) return sendWhatsAppMessage(to, "No plans in this category. Type MENU to start over.");

  session.context.category = category;
  session.state = "DATA_PLANS";
  session.markModified("context");
  await session.save();

  await sendWhatsAppList(to, `Choose a ${category} plan:`, "View Plans", [
    {
      title: category.slice(0, 24),
      rows: plans.map((p) => ({
        id: `PLAN_${p.planId}`,
        title: String(p.planName).slice(0, 24),
        description: `₦${p.botPrice > 0 ? p.botPrice : p.sellingPrice} — ${p.network}`,
      })),
    },
  ]);
};

const handleDataPlanSelect = async (to, session, planRowId, participant) => {
  const match = String(planRowId).match(/PLAN_(\d+)/i);
  if (!match) return sendWhatsAppMessage(to, "Invalid selection. Type MENU to start over.");
  const planId = Number(match[1]);
  const plan = await Plan.findOne({ planId, isAvailable: true, botEnabled: true });
  if (!plan) return sendWhatsAppMessage(to, "Plan not available. Type MENU to start over.");

  // botPrice is an optional per-plan override the admin sets specifically for
  // bot sales — when set it takes priority over normal reseller/api/selling pricing.
  const price = plan.botPrice > 0
    ? plan.botPrice
    : participant.type === "registered" ? resolvePrice(plan, participant.user) : plan.sellingPrice;

  session.context.planId = plan.planId;
  session.context.price = price;
  session.context.planName = plan.planName;
  session.context.network = plan.network;
  session.state = "DATA_CONFIRM";
  session.markModified("context");
  await session.save();

  await sendWhatsAppButtons(
    to,
    `*Confirm Purchase*\n\nPlan: ${plan.planName}\nNetwork: ${plan.network}\nPhone: ${session.context.phone}\nPrice: ₦${price.toLocaleString()}`,
    [{ id: "CONFIRM_DATA", title: "✅ Confirm" }, { id: "CANCEL", title: "❌ Cancel" }],
  );
};

const processRegisteredPurchase = async (to, session, user, endpoint, payload) => {
  const token = jwt.sign({ userId: user._id, userType: user.userType }, process.env.JWT_SECRET, { expiresIn: "15m" });
  try {
    const result = await apiCall("POST", endpoint, payload, token);
    const fresh = await User.findById(user._id);
    const suffix = await getBotNotification("registeredPurchaseSuccess");
    await sendWhatsAppMessage(to, `✅ ${result?.msg || "Purchase successful!"}\n\nBalance: ₦${fresh.balance.toLocaleString()}${suffix}`);
  } catch (err) {
    await sendWhatsAppMessage(to, `❌ ${err?.response?.data?.msg || "Transaction failed"}`);
  } finally {
    await resetToIdle(session);
  }
};

const handleDataConfirm = async (to, session, participant, user, guest) => {
  const payload = { plan: session.context.planId, mobile_number: session.context.phone, network: session.context.network };
  if (participant.type === "guest") {
    await initiateGuestPayment(to, session, guest, "data", payload, session.context.price);
  } else {
    await processRegisteredPurchase(to, session, user, "/buy/data", payload);
  }
};

// ── Airtime purchase flow ───────────────────────────────────────────────────

const handleAirtimePhone = async (to, session) => {
  session.state = "AIRTIME_PHONE";
  session.context = {};
  await session.save();
  await sendWhatsAppMessage(to, "📱 Enter the phone number to receive airtime:");
};

const handleAirtimePhoneInput = async (to, session, input) => {
  const phone = input.replace(/\D/g, "");
  if (!/^0\d{10}$/.test(phone)) return sendWhatsAppMessage(to, "Please enter a valid 11-digit phone number:");
  session.context.phone = phone;
  session.state = "AIRTIME_NETWORK";
  session.markModified("context");
  await session.save();
  await sendWhatsAppList(to, "Select network:", "Choose Network", [
    {
      title: "Networks",
      rows: NETWORKS.map((n) => ({ id: n, title: n === "9MOBILE" ? "9mobile" : n.charAt(0) + n.slice(1).toLowerCase(), description: "" })),
    },
  ]);
};

const handleAirtimeNetwork = async (to, session, networkId) => {
  if (!NETWORKS.includes(networkId)) return sendWhatsAppMessage(to, "Invalid network. Type MENU to start over.");
  session.context.network = networkId;
  session.state = "AIRTIME_AMOUNT";
  session.markModified("context");
  await session.save();
  await sendWhatsAppMessage(to, "Enter amount in ₦, minimum ₦50:");
};

const handleAirtimeAmount = async (to, session, input) => {
  const amount = parseFloat(String(input).replace(/[^\d.]/g, ""));
  if (!amount || amount < 50) return sendWhatsAppMessage(to, "Please enter a valid amount (minimum ₦50):");
  session.context.amount = amount;
  session.state = "AIRTIME_CONFIRM";
  session.markModified("context");
  await session.save();
  await sendWhatsAppButtons(
    to,
    `*Confirm Purchase*\n\nNetwork: ${session.context.network}\nPhone: ${session.context.phone}\nAmount: ₦${amount.toLocaleString()}`,
    [{ id: "CONFIRM_AIRTIME", title: "✅ Confirm" }, { id: "CANCEL", title: "❌ Cancel" }],
  );
};

const handleAirtimeConfirm = async (to, session, participant, user, guest) => {
  const payload = { mobile_number: session.context.phone, amount: session.context.amount, network: session.context.network };
  if (participant.type === "guest") {
    await initiateGuestPayment(to, session, guest, "airtime", payload, session.context.amount);
  } else {
    await processRegisteredPurchase(to, session, user, "/buy/airtime", payload);
  }
};

// ── Electricity purchase flow ───────────────────────────────────────────────

const handleElecDisco = async (to, session, participant, discoId) => {
  if (!discoId) {
    try {
      const result = await apiCall("GET", "/buy/fetchDiscos", null, null);
      const discos = Array.isArray(result) ? result : result?.discos || result?.data || [];
      if (!discos.length) return sendWhatsAppMessage(to, "Unable to load electricity providers right now.");
      const trimmed = discos.slice(0, 10);
      session.context = { discos: trimmed };
      session.state = "ELEC_DISCO";
      session.markModified("context");
      await session.save();
      await sendWhatsAppList(to, "Select your electricity provider:", "View Discos", [
        {
          title: "Providers",
          rows: trimmed.map((d, i) => ({
            id: `DISCO_${i}`,
            title: String(d.name || d.disco_name || d).slice(0, 24),
            description: "",
          })),
        },
      ]);
    } catch (e) {
      console.error("[handleElecDisco]", e?.response?.data || e.message);
      await sendWhatsAppMessage(to, "Unable to load electricity providers right now.");
    }
    return;
  }

  const idx = parseInt(String(discoId).replace(/^DISCO_/i, ""), 10);
  const discos = session.context?.discos || [];
  const disco = discos[idx];
  if (!disco) return sendWhatsAppMessage(to, "Invalid selection. Type MENU to start over.");

  session.context.meterId = disco.id ?? disco.disco_id ?? disco.value ?? disco;
  session.context.discoName = disco.name ?? disco.disco_name ?? String(disco);
  session.state = "ELEC_METER";
  session.markModified("context");
  await session.save();
  await sendWhatsAppMessage(to, "Enter your meter number:");
};

const handleElecMeter = async (to, session, input) => {
  const meterNumber = input.replace(/\D/g, "");
  if (!meterNumber) return sendWhatsAppMessage(to, "Please enter a valid meter number:");
  session.context.meterNumber = meterNumber;
  session.state = "ELEC_TYPE";
  session.markModified("context");
  await session.save();
  await sendWhatsAppButtons(to, "Select meter type:", [
    { id: "PREPAID", title: "Prepaid" },
    { id: "POSTPAID", title: "Postpaid" },
  ]);
};

const handleElecType = async (to, session, meterTypeId) => {
  if (!["PREPAID", "POSTPAID"].includes(meterTypeId)) return sendWhatsAppMessage(to, "Invalid selection. Type MENU to start over.");
  session.context.meterType = meterTypeId;
  session.markModified("context");
  await session.save();

  try {
    const token = await getBotToken();
    const result = await apiCall(
      "POST",
      "/buy/validateMeter",
      { meterId: session.context.meterId, meterNumber: session.context.meterNumber, meterType: meterTypeId },
      token,
    );
    session.context.customerName = result?.name || result?.customerName || result?.Customer_Name || "Customer";
    session.state = "ELEC_AMOUNT";
    session.markModified("context");
    await session.save();
    await sendWhatsAppMessage(
      to,
      `✅ Meter validated: *${session.context.customerName}*\n\nEnter amount in ₦ (minimum ₦500, ₦50 service fee applies):`,
    );
  } catch (e) {
    await resetToIdle(session);
    await sendWhatsAppMessage(to, `❌ Unable to validate meter: ${e?.response?.data?.msg || "please try again."}`);
  }
};

const handleElecAmount = async (to, session, input) => {
  const amount = parseFloat(String(input).replace(/[^\d.]/g, ""));
  if (!amount || amount < 500) return sendWhatsAppMessage(to, "Please enter a valid amount (minimum ₦500):");
  session.context.amount = amount;
  session.state = "ELEC_CONFIRM";
  session.markModified("context");
  await session.save();
  const total = amount + 50;
  await sendWhatsAppButtons(
    to,
    `*Confirm Purchase*\n\nCustomer: ${session.context.customerName}\nMeter: ${session.context.meterNumber} (${session.context.meterType})\nAmount: ₦${amount.toLocaleString()}\nService Fee: ₦50\nTotal: ₦${total.toLocaleString()}`,
    [{ id: "CONFIRM_ELEC", title: "✅ Confirm" }, { id: "CANCEL", title: "❌ Cancel" }],
  );
};

const handleElecConfirm = async (to, session, participant, user, guest) => {
  const payload = {
    meterId: session.context.meterId,
    meterNumber: session.context.meterNumber,
    amount: session.context.amount,
    meterType: session.context.meterType,
  };
  const total = session.context.amount + 50;
  if (participant.type === "guest") {
    await initiateGuestPayment(to, session, guest, "electricity", payload, total);
  } else {
    await processRegisteredPurchase(to, session, user, "/buy/electricity", payload);
  }
};

// ── Awaiting payment ─────────────────────────────────────────────────────────

// Estimates the real settlement amount from a gross amountPaid, using the
// admin-configured Monnify charge (percent, capped at a flat maximum — same
// pattern as the existing BillStack webhook). Used only for the guest's
// active PAID check; the real webhook always reports the true settlementAmount.
const estimateSettlement = async (amountPaid) => {
  const cfg = await Settings.getSingleton();
  const percent = Number(cfg.monnifyChargePercent) || 0;
  const cap = Number(cfg.monnifyChargeCap) || 0;
  let charge = amountPaid * (percent / 100);
  if (cap > 0 && charge > cap) charge = cap;
  return Math.max(amountPaid - charge, 0);
};

const handleAwaitingPayment = async (to, session, guest, inputUpper) => {
  const orderId = session.context?.orderId;
  const order = orderId ? await GuestPendingOrder.findById(orderId) : null;
  if (!order) {
    await resetToIdle(session);
    return sendWhatsAppMessage(to, "No pending order found. Type MENU to start over.");
  }

  if (inputUpper === "PAID" || inputUpper === "CONFIRM") {
    if (order.monnifyAmount === 0) {
      await fulfillGuestOrder(order, 0);
      await resetToIdle(session);
      return;
    }

    // Actively check Monnify's own record instead of only waiting for their
    // webhook — otherwise the guest is stuck here forever if the webhook is
    // slow, misconfigured, or never arrives.
    try {
      const status = await checkMonnifyPaymentStatus(order.monnifyReference);
      const paid = status?.paymentStatus === "PAID" || status?.paymentStatus === "OVERPAID";
      if (paid) {
        // Monnify's query response only gives the gross amountPaid, not the
        // true fee-deducted settlementAmount — estimate it from the admin's
        // configured charge so the bot wallet isn't overcredited. If the real
        // webhook arrives later for this same order, fulfillGuestOrder's
        // atomic claim guard means it's a no-op — no double credit.
        const amountPaid = status?.amountPaid || order.monnifyAmount;
        const estimatedSettlement = await estimateSettlement(amountPaid);
        await fulfillGuestOrder(order, estimatedSettlement);
        await resetToIdle(session);
        return;
      }
    } catch (e) {
      console.error(`[handleAwaitingPayment] status check failed at step [${e.monnifyStep || "unknown"}]:`, e?.response?.data || e.message);
    }

    await sendWhatsAppMessage(
      to,
      "⏳ We haven't received your payment yet. If you've just paid, give it a moment and reply *PAID* again — or reply *CANCEL* to abort.",
    );
    return;
  }

  if (inputUpper === "CANCEL") {
    order.status = "expired";
    await order.save();
    await resetToIdle(session);
    return sendWhatsAppMessage(to, "Order cancelled.");
  }

  await sendWhatsAppMessage(
    to,
    order.monnifyAmount > 0
      ? "Please complete the bank transfer, then reply *PAID*. Or reply *CANCEL* to abort."
      : "Reply *CONFIRM* to proceed with this purchase, or *CANCEL* to abort.",
  );
};

// ── Link / unlink account ───────────────────────────────────────────────────

const completeLinking = async (phoneNumber, session, user) => {
  const guest = await GuestUser.findOne({ phoneNumber });
  const guestBalance = guest?.balance || 0;

  const update = { $set: { whatsappNumber: phoneNumber }, $unset: { whatsappLinkCode: 1, whatsappLinkCodeExpires: 1 } };
  if (guestBalance > 0) update.$inc = { balance: guestBalance };
  await User.updateOne({ _id: user._id }, update);
  if (guest) await GuestUser.deleteOne({ _id: guest._id });

  session.userId = user._id;
  session.guestId = null;
  session.state = "IDLE";
  session.context = {};
  await session.save();

  const fresh = await User.findById(user._id);
  await sendWhatsAppMessage(
    phoneNumber,
    `✅ Account linked!${guestBalance > 0 ? ` Your guest balance of ₦${guestBalance.toLocaleString()} has been added to your wallet.` : ""}\n\nYou now have ₦${fresh.balance.toLocaleString()}.`,
  );
};

const handleLinkAccount = async (to, session, participant) => {
  if (participant.type === "registered") return sendWhatsAppMessage(to, "Your account is already linked.");
  await sendWhatsAppMessage(
    to,
    "🔗 *Link Your Account*\n\n1. Log in on the website and open *Profile*\n2. Tap *Generate Link Code*\n3. Come back here and send: *LINK 123456* (using the code shown)\n\nThe code expires in 5 minutes.",
  );
};

const handleUnlinkAccount = async (to, session, participant) => {
  if (participant.type !== "registered") return sendWhatsAppMessage(to, "You don't have a linked account.");
  session.state = "UNLINK_CONFIRM";
  await session.save();
  await sendWhatsAppButtons(to, "Are you sure you want to unlink your WhatsApp from this account?", [
    { id: "CONFIRM_UNLINK", title: "Yes, Unlink" },
    { id: "CANCEL", title: "Cancel" },
  ]);
};

const handleUnlinkConfirm = async (to, session, user) => {
  await User.updateOne({ _id: user._id }, { $unset: { whatsappNumber: 1 } });
  const guest = await GuestUser.findOneAndUpdate(
    { phoneNumber: to },
    { $setOnInsert: { phoneNumber: to }, $set: { lastInteractedAt: new Date() } },
    { upsert: true, new: true },
  );
  session.userId = null;
  session.guestId = guest._id;
  session.state = "IDLE";
  session.context = {};
  await session.save();
  await sendWhatsAppMessage(to, "🔓 Account unlinked. You are now using the bot as a guest.");
};

// ── Main dispatcher ─────────────────────────────────────────────────────────

const cancelBack = async (to, session, message = "Cancelled. Type *menu* to start over.") => {
  await resetToIdle(session);
  return sendWhatsAppMessage(to, message);
};

const handleMessage = async (from, messageBody, messageType, buttonId, profileName) => {
  const session = await getOrCreateSession(from);
  let participant = await getParticipant(session);

  if (participant.type === "none") {
    const guest = await ensureGuest(session, from, profileName);
    participant = { type: "guest", guest };
  }

  const input = (buttonId || messageBody || "").trim();
  const inputUpper = input.toUpperCase();

  // AWAITING_PAYMENT is protected — a live payment must never be reset by "hi"/"menu"
  if (session.state === "AWAITING_PAYMENT") {
    return handleAwaitingPayment(from, session, participant.guest, inputUpper);
  }

  // Website-issued "LINK 123456" code — works standalone for guests
  const linkMatch = input.match(/^LINK\s+(\d{4,8})$/i);
  if (linkMatch && participant.type === "guest") {
    const hash = crypto.createHash("sha256").update(linkMatch[1]).digest("hex");
    const user = await User.findOne({ whatsappLinkCode: hash, whatsappLinkCodeExpires: { $gt: new Date() } });
    if (!user) return sendWhatsAppMessage(from, "That code is invalid or has expired.");
    return completeLinking(from, session, user);
  }

  if (["HI", "HELLO", "MENU", "START", "HOME"].includes(inputUpper) || !input) {
    await resetToIdle(session);
    return sendMainMenu(from, session, participant);
  }

  switch (session.state) {
    case "IDLE":
      switch (inputUpper) {
        case "BUY_DATA": return handleDataPhone(from, session);
        case "BUY_AIRTIME": return handleAirtimePhone(from, session);
        case "BUY_ELEC": return handleElecDisco(from, session, participant, null);
        case "CHECK_BAL": return handleBalance(from, participant);
        case "MY_TRANS": return handleTransactions(from, participant);
        case "LINK_ACCOUNT": return handleLinkAccount(from, session, participant);
        case "UNLINK_ACCOUNT": return handleUnlinkAccount(from, session, participant);
        default: return sendMainMenu(from, session, participant);
      }

    case "DATA_PHONE": return handleDataPhoneInput(from, session, input);
    case "DATA_NETWORK": return handleDataNetwork(from, session, inputUpper);
    case "DATA_CATEGORY": return handleDataCategory(from, session, inputUpper);
    case "DATA_PLANS": return handleDataPlanSelect(from, session, inputUpper, participant);
    case "DATA_CONFIRM":
      if (inputUpper === "CONFIRM_DATA") return handleDataConfirm(from, session, participant, participant.user, participant.guest);
      if (inputUpper === "CANCEL") return cancelBack(from, session);
      return sendWhatsAppMessage(from, "Please tap Confirm or Cancel.");

    case "AIRTIME_PHONE": return handleAirtimePhoneInput(from, session, input);
    case "AIRTIME_NETWORK": return handleAirtimeNetwork(from, session, inputUpper);
    case "AIRTIME_AMOUNT": return handleAirtimeAmount(from, session, input);
    case "AIRTIME_CONFIRM":
      if (inputUpper === "CONFIRM_AIRTIME") return handleAirtimeConfirm(from, session, participant, participant.user, participant.guest);
      if (inputUpper === "CANCEL") return cancelBack(from, session);
      return sendWhatsAppMessage(from, "Please tap Confirm or Cancel.");

    case "ELEC_DISCO": return handleElecDisco(from, session, participant, inputUpper);
    case "ELEC_METER": return handleElecMeter(from, session, input);
    case "ELEC_TYPE": return handleElecType(from, session, inputUpper);
    case "ELEC_AMOUNT": return handleElecAmount(from, session, input);
    case "ELEC_CONFIRM":
      if (inputUpper === "CONFIRM_ELEC") return handleElecConfirm(from, session, participant, participant.user, participant.guest);
      if (inputUpper === "CANCEL") return cancelBack(from, session);
      return sendWhatsAppMessage(from, "Please tap Confirm or Cancel.");

    case "UNLINK_CONFIRM":
      if (inputUpper === "CONFIRM_UNLINK") return handleUnlinkConfirm(from, session, participant.user);
      if (inputUpper === "CANCEL") return cancelBack(from, session, "Cancelled.");
      return sendWhatsAppMessage(from, "Please tap an option.");

    default:
      return sendMainMenu(from, session, participant);
  }
};

module.exports = { handleMessage };
