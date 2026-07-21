const axios = require("axios");
const { v4: uuid } = require("uuid");
const Settings = require("../Models/settingsModel");

// Strip trailing slash(es) — a baseUrl saved as "https://api.monnify.com/"
// combined with our leading-slash paths below produces a double slash
// (".com//api/v1/...") that Monnify's gateway rejects with a generic
// "unauthorized / full authentication required" error before it ever
// reaches the real login handler.
const resolveMonnifyConfig = (cfg) => ({
  apiKey: cfg.monnifyApiKey || process.env.MONNIFY_API_KEY || "",
  secretKey: cfg.monnifySecretKey || process.env.MONNIFY_SECRET_KEY || "",
  contractCode: cfg.monnifyContractCode || process.env.MONNIFY_CONTRACT_CODE || "",
  baseUrl: (cfg.monnifyBaseUrl || process.env.MONNIFY_BASE_URL || "https://api.monnify.com").replace(/\/+$/, ""),
});

const getMonnifyAccessToken = async ({ apiKey, secretKey, baseUrl }) => {
  const basicAuth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  try {
    const { data: authData } = await axios.post(
      `${baseUrl}/api/v1/auth/login`,
      {},
      { headers: { Authorization: `Basic ${basicAuth}` } },
    );
    const accessToken = authData?.responseBody?.accessToken;
    if (!accessToken) throw new Error("Monnify login succeeded but returned no accessToken");
    return accessToken;
  } catch (e) {
    e.monnifyStep = "auth/login";
    throw e;
  }
};

const initiateGuestMonnifyPayment = async (amount, customerEmail, customerName) => {
  const cfg = await Settings.getSingleton();
  const { contractCode, baseUrl, ...creds } = resolveMonnifyConfig(cfg);
  const accessToken = await getMonnifyAccessToken({ ...creds, baseUrl });

  const paymentReference = uuid();
  let txData;
  try {
    ({ data: txData } = await axios.post(
      `${baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        amount,
        customerName,
        customerEmail,
        paymentReference,
        paymentDescription: "Bot Wallet Funding",
        currencyCode: "NGN",
        contractCode,
        redirectUrl: "",
        paymentMethods: ["ACCOUNT_TRANSFER"],
      },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ));
  } catch (e) {
    e.monnifyStep = "init-transaction";
    throw e;
  }

  // Monnify's response carries TWO different references: `paymentReference`
  // just echoes back what we sent, while `transactionReference` is Monnify's
  // own internal ID — and it's the one every subsequent call (like this
  // bank-transfer/init-payment step) needs. Passing the wrong one here is
  // what was causing "Unable to generate a payment account" failures.
  const monnifyTransactionReference = txData?.responseBody?.transactionReference;
  let bankData;
  try {
    ({ data: bankData } = await axios.post(
      `${baseUrl}/api/v1/merchant/bank-transfer/init-payment`,
      { transactionReference: monnifyTransactionReference, bankCode: "035" },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ));
  } catch (e) {
    e.monnifyStep = "bank-transfer/init-payment";
    throw e;
  }

  return {
    // Our own paymentReference (not Monnify's transactionReference) is what
    // gets echoed back in the webhook payload, so this is what we store on
    // GuestPendingOrder.monnifyReference to match it later.
    paymentReference,
    accountNumber: bankData?.responseBody?.accountNumber,
    bankName: bankData?.responseBody?.bankName,
    accountName: bankData?.responseBody?.accountName,
  };
};

// Actively checks Monnify's own record of a transaction instead of only
// waiting for their webhook — used when a guest replies PAID so they aren't
// stuck forever if the webhook never arrives (not configured, delayed, etc).
const checkMonnifyPaymentStatus = async (paymentReference) => {
  const cfg = await Settings.getSingleton();
  const { contractCode, ...creds } = resolveMonnifyConfig(cfg);
  const accessToken = await getMonnifyAccessToken(creds);

  try {
    const { data } = await axios.get(
      `${creds.baseUrl}/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return data?.responseBody || null;
  } catch (e) {
    e.monnifyStep = "transactions/query";
    throw e;
  }
};

module.exports = { initiateGuestMonnifyPayment, checkMonnifyPaymentStatus };
