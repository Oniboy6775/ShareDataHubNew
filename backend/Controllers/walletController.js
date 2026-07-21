const axios = require("axios");
const crypto = require("crypto");
const User = require("../Models/userModel");
const Transaction = require("../Models/transactionModel");
const Settings = require("../Models/settingsModel");
const generateReceipt = require("../Utils/generateReceipt");
const notify = require("../Utils/notify");
const { v4: uuid } = require("uuid");

const initiateFunding = async (req, res) => {
  const { amount } = req.body;
  if (!amount || Number(amount) < 100)
    return res.status(400).json({ msg: "Minimum funding amount is ₦100" });
  try {
    const user = await User.findById(req.user.userId).select("email phoneNumber userName");
    if (!user) return res.status(404).json({ msg: "User not found" });

    const cfg = await Settings.getSingleton();
    const monnifyApiKey      = cfg.monnifyApiKey      || process.env.MONNIFY_API_KEY      || "";
    const monnifySecretKey   = cfg.monnifySecretKey   || process.env.MONNIFY_SECRET_KEY   || "";
    const monnifyContractCode= cfg.monnifyContractCode|| process.env.MONNIFY_CONTRACT_CODE|| "";
    const baseUrl            = (cfg.monnifyBaseUrl   || process.env.MONNIFY_BASE_URL     || "https://api.monnify.com").replace(/\/+$/, "");
    const frontendUrl        = cfg.frontendUrl        || process.env.FRONTEND_URL         || "";

    const apiKey = Buffer.from(`${monnifyApiKey}:${monnifySecretKey}`).toString("base64");

    const { data: authData } = await axios.post(
      `${baseUrl}/api/v1/auth/login`,
      {},
      { headers: { Authorization: `Basic ${apiKey}` } }
    );
    const accessToken = authData?.responseBody?.accessToken;

    const { data: txData } = await axios.post(
      `${baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        amount: Number(amount),
        customerName: user.userName,
        customerEmail: user.email,
        paymentReference: uuid(),
        paymentDescription: "Wallet Funding",
        currencyCode: "NGN",
        contractCode: monnifyContractCode,
        redirectUrl: `${frontendUrl}/fund-wallet`,
        paymentMethods: ["ACCOUNT_TRANSFER", "CARD"],
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.status(200).json({
      checkoutUrl: txData?.responseBody?.checkoutUrl,
      paymentReference: txData?.responseBody?.paymentReference,
    });
  } catch (e) {
    console.error("[initiateFunding]", e.message);
    res.status(500).json({ msg: e?.response?.data?.responseMessage || "Payment initiation failed" });
  }
};

// Monnify webhook — credit user on successful payment
const monnifyWebhook = async (req, res) => {
  res.sendStatus(200);
  const { eventType, eventData } = req.body;
  if (eventType !== "SUCCESSFUL_TRANSACTION") return;
  if (!eventData?.customer?.email) return;
  try {
    const { settlementAmount, amountPaid, customer: { email }, destinationAccountInformation } = eventData;
    const user = await User.findOne({ email });
    if (!user) return;
    const charges = (amountPaid - settlementAmount).toFixed(2);
    await User.updateOne({ _id: user._id }, { $inc: { balance: settlementAmount } });
    await generateReceipt({
      transactionId: uuid(),
      planNetwork: "Auto-funding||Monnify",
      status: "success",
      planName: `₦${amountPaid}`,
      phoneNumber: destinationAccountInformation?.accountNumber || user.userName,
      amountToCharge: settlementAmount,
      balance: user.balance,
      userId: user._id,
      userName: user.userName,
      type: "wallet",
    });
    await notify({
      title: "Wallet Funded",
      body: `₦${settlementAmount} wallet funding by ${user.userName}`,
      type: "funding",
      userId: user._id,
    });
  } catch (e) {
    console.error("[monnifyWebhook]", e.message);
  }
};

const createReservedAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.accountNumbers?.length)
      return res.status(400).json({ msg: "You already have a dedicated account" });

    const cfg = await Settings.getSingleton();
    const monnifyApiKey       = cfg.monnifyApiKey       || process.env.MONNIFY_API_KEY       || "";
    const monnifySecretKey    = cfg.monnifySecretKey    || process.env.MONNIFY_SECRET_KEY    || "";
    const monnifyContractCode = cfg.monnifyContractCode || process.env.MONNIFY_CONTRACT_CODE || "";
    const baseUrl             = (cfg.monnifyBaseUrl    || process.env.MONNIFY_BASE_URL      || "https://api.monnify.com").replace(/\/+$/, "");

    const apiKey = Buffer.from(`${monnifyApiKey}:${monnifySecretKey}`).toString("base64");
    const { data: authData } = await axios.post(`${baseUrl}/api/v1/auth/login`, {}, {
      headers: { Authorization: `Basic ${apiKey}` },
    });
    const accessToken = authData?.responseBody?.accessToken;

    const { data: resData } = await axios.post(
      `${baseUrl}/api/v2/bank-transfer/reserved-accounts`,
      {
        accountReference:  `aff-${user._id}`,
        accountName:       user.userName,
        currencyCode:      "NGN",
        contractCode:      monnifyContractCode,
        customerName:      user.userName,
        customerEmail:     user.email,
        getAllAvailableBanks: true,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const accounts = resData?.responseBody?.accounts || [];
    if (!accounts.length) return res.status(500).json({ msg: "No account returned by Monnify" });

    const accountNumbers = accounts.map(a => ({ bankName: a.bankName, accountNumber: a.accountNumber }));
    await User.updateOne({ _id: user._id }, { $set: { accountNumbers } });
    const updated = await User.findById(user._id).select("-password -apiToken");
    res.status(200).json({ msg: "Dedicated account created!", user: updated });
  } catch (e) {
    console.error("[createReservedAccount]", e?.response?.data || e.message);
    res.status(500).json({ msg: e?.response?.data?.responseMessage || "Failed to create account" });
  }
};

const createBillStackAccount = async (req, res) => {
  const { bankName } = req.body;
  if (!bankName) return res.status(400).json({ msg: "bankName is required" });
  try {
    const [user, cfg] = await Promise.all([User.findById(req.user.userId), Settings.getSingleton()]);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const api    = cfg.billstackApi    || process.env.BILLSTACK_API    || "";
    const secret = cfg.billstackSecret || process.env.BILLSTACK_SECRET || "";
    if (!api || !secret) return res.status(503).json({ msg: "BillStack is not configured" });

    const alreadyHas = user.accountNumbers?.some(a => a.bankName?.toUpperCase() === bankName.toUpperCase());
    if (alreadyHas) return res.status(400).json({ msg: `You already have a ${bankName} account` });

    const { data: result } = await axios.post(
      `${api}/generateVirtualAccount/`,
      {
        reference: `${bankName.toUpperCase()}_${user.email}`,
        email:     user.email,
        phone:     user.phoneNumber,
        firstName: user.userName,
        lastName:  user.userName,
        bank:      bankName.toUpperCase(),
      },
      { headers: { Authorization: `Bearer ${secret}` } }
    );

    if (!result.status) {
      let msg = result.message || `Unable to generate ${bankName} account`;
      if (msg === "Refrence already exist") msg = `You already have a ${bankName} account`;
      return res.status(400).json({ msg });
    }

    const accountNumber = result.data.account[0].account_number;
    await User.updateOne({ _id: user._id }, { $push: { accountNumbers: { bankName: bankName.toUpperCase(), accountNumber } } });
    const updated = await User.findById(user._id).select("-password -apiToken");
    res.status(200).json({ msg: `${bankName} virtual account created!`, user: updated });
  } catch (e) {
    console.error("[createBillStackAccount]", e?.response?.data || e.message);
    res.status(500).json({ msg: e?.response?.data?.message || "Failed to generate account" });
  }
};

const billStackWebhook = async (req, res) => {
  res.sendStatus(200);
  const signature = req.headers["x-wiaxy-signature"];
  const cfg = await Settings.getSingleton().catch(() => ({}));
  const secret = cfg.billstackSecret || process.env.BILLSTACK_SECRET || "";
  const expected = crypto.createHash("md5").update(secret).digest("hex");
  if (signature !== expected) return;
  if (req.body?.data?.type !== "RESERVED_ACCOUNT_TRANSACTION") return;
  try {
    const { merchant_reference, transaction_ref, amount, account: { account_number, bank_name } } = req.body.data;
    const customerEmail = merchant_reference.split("_").slice(1).join("_");
    const user = await User.findOne({ email: customerEmail });
    if (!user) return;

    let charges = parseFloat(amount) * 0.005;
    if (charges > 50) charges = 50;
    const settlementAmount = parseFloat((amount - charges).toFixed(2));

    const inserted = await Transaction.findOneAndUpdate(
      { trans_Id: transaction_ref },
      {
        $setOnInsert: {
          trans_Id: transaction_ref,
          trans_By: user._id,
          trans_UserName: user.userName,
          trans_Type: "wallet",
          trans_Network: `Auto-funding||${bank_name}`,
          phone_number: account_number,
          trans_amount: settlementAmount,
          trans_profit: 0,
          balance_Before: user.balance,
          balance_After: user.balance + settlementAmount,
          apiResponse: `₦${amount} received via ${bank_name}. ₦${settlementAmount} credited, ₦${charges.toFixed(2)} charge deducted.`,
          trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
          trans_Status: "success",
          createdAt: Date.now(),
        },
      },
      { upsert: true, new: false }
    );
    if (inserted) return;

    await User.updateOne({ _id: user._id }, { $inc: { balance: settlementAmount } });
    await notify({ title: "Wallet Funded", body: `₦${settlementAmount} funded via ${bank_name}`, type: "funding", userId: user._id });
  } catch (e) {
    console.error("[billStackWebhook]", e.message);
  }
};

module.exports = { monnifyWebhook, initiateFunding, createReservedAccount, createBillStackAccount, billStackWebhook };
