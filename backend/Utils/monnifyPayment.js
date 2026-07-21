const axios = require("axios");
const { v4: uuid } = require("uuid");
const Settings = require("../Models/settingsModel");

const initiateGuestMonnifyPayment = async (amount, customerEmail, customerName) => {
  const cfg = await Settings.getSingleton();
  const apiKey = cfg.monnifyApiKey || process.env.MONNIFY_API_KEY || "";
  const secretKey = cfg.monnifySecretKey || process.env.MONNIFY_SECRET_KEY || "";
  const contractCode = cfg.monnifyContractCode || process.env.MONNIFY_CONTRACT_CODE || "";
  const baseUrl = cfg.monnifyBaseUrl || process.env.MONNIFY_BASE_URL || "https://api.monnify.com";

  const basicAuth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  const { data: authData } = await axios.post(
    `${baseUrl}/api/v1/auth/login`,
    {},
    { headers: { Authorization: `Basic ${basicAuth}` } },
  );
  const accessToken = authData?.responseBody?.accessToken;

  const paymentReference = uuid();
  const { data: txData } = await axios.post(
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
  );

  const transactionReference = txData?.responseBody?.paymentReference || paymentReference;
  const { data: bankData } = await axios.post(
    `${baseUrl}/api/v1/merchant/bank-transfer/init-payment`,
    { transactionReference, bankCode: "035" },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  return {
    paymentReference: transactionReference,
    accountNumber: bankData?.responseBody?.accountNumber,
    bankName: bankData?.responseBody?.bankName,
    accountName: bankData?.responseBody?.accountName,
  };
};

module.exports = { initiateGuestMonnifyPayment };
