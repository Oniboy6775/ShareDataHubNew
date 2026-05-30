const axios = require("axios");
const bcrypt = require("bcrypt");
const { v4: uuid } = require("uuid");
const User = require("../Models/userModel");
const Plan = require("../Models/planModel");
const Settings = require("../Models/settingsModel");
const generateReceipt = require("../Utils/generateReceipt");
const Transaction = require("../Models/transactionModel");
const notify = require("../Utils/notify");

const parseGB = (planName = "") => {
  const mb = planName.match(/(\d+(?:\.\d+)?)\s*MB/i);
  if (mb) return parseFloat(mb[1]) / 1024;
  const gb = planName.match(/(\d+(?:\.\d+)?)\s*GB/i);
  if (gb) return parseFloat(gb[1]);
  return 0;
};

const getMainPlatformClient = async () => {
  const settings = await Settings.getSingleton();
  if (!settings.mainPlatformUrl || !settings.mainPlatformApiKey)
    throw new Error("Main platform not configured. Contact admin.");
  return {
    url: settings.mainPlatformUrl,
    headers: { Authorization: `Bearer ${settings.mainPlatformApiKey}` },
    commissionPerPlan: settings.commissionPerPlan || [],
  };
};

const verifyPin = async (user, pin) => {
  if (!user.pinEnabled) return true;
  if (!pin) return false;
  return bcrypt.compare(String(pin), user.transactionPin);
};

const resolvePrice = (plan, user) => {
  if (user?.isSpecial && user.specialPrices?.length) {
    const sp = user.specialPrices.find((s) => s.planId === plan.planId);
    if (sp?.price) return sp.price;
  }
  if (user?.userType === "reseller" && plan.resellerPrice)
    return plan.resellerPrice;
  if (user?.userType === "api user" && plan.apiPrice) return plan.apiPrice;
  return plan.sellingPrice;
};

const creditReferralCommission = async (user, planId, amountToCharge) => {
  try {
    if (!user.referredBy) return;
    const settings = await Settings.getSingleton();
    const commEntry = settings.commissionPerPlan.find(
      (c) => c.planId === planId,
    );
    if (!commEntry || !commEntry.amount) return;
    const sponsor = await User.findOne({ userName: user.referredBy });
    if (!sponsor) return;
    await User.updateOne(
      { _id: sponsor._id },
      { $inc: { earningBalance: commEntry.amount } },
    );
    await User.updateOne(
      { _id: sponsor._id, "referrals.userName": user.userName },
      { $inc: { "referrals.$.amountEarn": commEntry.amount } },
    );
  } catch (e) {
    console.error("[commission] failed:", e.message);
  }
};

const buyData = async (req, res) => {
  const { userId, userType } = req.user;
  const { plan, mobile_number, transactionPin } = req.body;
  const network = req.body.network?.toString().toUpperCase();
  if (!plan || !mobile_number || !network)
    return res.status(400).json({ msg: "All fields are required" });

  let amountToCharge = 0;
  let transactionId = null;
  let balanceDeducted = false;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isSuspended)
      return res.status(403).json({ msg: "Account suspended" });
    if (!(await verifyPin(user, transactionPin)))
      return res.status(403).json({ msg: "Incorrect transaction PIN" });

    const planInfo = await Plan.findOne({
      planId: Number(plan),
      isAvailable: true,
    });
    if (!planInfo) return res.status(400).json({ msg: "Plan not available" });

    amountToCharge = resolvePrice(planInfo, user);
    if (!amountToCharge)
      return res.status(400).json({ msg: "Unable to determine price" });
    if (user.balance < amountToCharge)
      return res
        .status(400)
        .json({ msg: "Insufficient balance. Kindly fund your wallet" });

    const { url, headers } = await getMainPlatformClient();
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: -amountToCharge } },
    );
    balanceDeducted = true;

    transactionId = `${new Date().getFullYear()}-DATA-${uuid()}`.substring(
      0,
      28,
    );
    await generateReceipt({
      transactionId,
      planNetwork: planInfo.network,
      status: "processing",
      planName: `${planInfo.planType} ${planInfo.planName}`,
      phoneNumber: mobile_number,
      amountToCharge,
      costPrice: planInfo.costPrice || 0,
      balance: user.balance,
      userId,
      userName: user.userName,
      type: "data",
      volumeRatio: parseGB(planInfo.planName),
    });

    const { data: mainRes } = await axios.post(
      `${url}/buy/data`,
      { plan, mobile_number, network },
      { headers },
    );
    const success =
      mainRes?.receipt?.trans_Status === "success" ||
      mainRes?.receipt?.trans_Status === "processing";

    if (success) {
      await Transaction.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: mainRes.receipt?.trans_Status || "success",
            apiResponse: mainRes.msg || "",
          },
        },
      );
      creditReferralCommission(user, planInfo.planId, amountToCharge);
      const receipt = await Transaction.findOne({ trans_Id: transactionId });
      return res
        .status(200)
        .json({ msg: mainRes.msg || "Purchase successful", receipt });
    } else {
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: amountToCharge } },
      );
      await Transaction.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: "failed",
            balance_After: user.balance,
            trans_profit: 0,
            apiResponse: mainRes?.msg || "Failed",
          },
        },
      );
      await notify({
        title: "Purchase Failed",
        body: `Failed data purchase by ${user.userName} — ${
          mainRes?.msg || "unknown"
        }`,
        type: "failed",
        userId,
      });
      return res
        .status(500)
        .json({ msg: mainRes?.msg || "Transaction failed" });
    }
  } catch (error) {
    console.error("[buyData]", error?.response?.data || error.message);
    if (balanceDeducted) {
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: amountToCharge } },
      ).catch(() => {});
    }
    if (transactionId) {
      await Transaction.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: "failed",
            trans_profit: 0,
            apiResponse: error?.response?.data?.msg || error.message || "Error",
          },
        },
      ).catch(() => {});
    }
    return res
      .status(500)
      .json({ msg: error?.response?.data?.msg || "Transaction failed" });
  }
};

const buyAirtime = async (req, res) => {
  const { userId } = req.user;
  const { mobile_number, amount, transactionPin } = req.body;
  const network = req.body.network?.toString().toUpperCase();
  if (!mobile_number || !amount || !network)
    return res.status(400).json({ msg: "All fields are required" });

  let amountToCharge = 0;
  let transactionId = null;
  let balanceDeducted = false;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isSuspended)
      return res.status(403).json({ msg: "Account suspended" });
    if (!(await verifyPin(user, transactionPin)))
      return res.status(403).json({ msg: "Incorrect transaction PIN" });

    amountToCharge = parseFloat(amount);
    if (user.balance < amountToCharge)
      return res
        .status(400)
        .json({ msg: "Insufficient balance. Kindly fund your wallet" });

    const { url, headers } = await getMainPlatformClient();
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: -amountToCharge } },
    );
    balanceDeducted = true;

    transactionId = `${new Date().getFullYear()}-AIRTIME-${uuid()}`.substring(
      0,
      28,
    );
    await generateReceipt({
      transactionId,
      planNetwork: network,
      status: "processing",
      planName: String(amount),
      phoneNumber: mobile_number,
      amountToCharge,
      balance: user.balance,
      userId,
      userName: user.userName,
      type: "airtime",
    });

    const { data: mainRes } = await axios.post(
      `${url}/buy/airtime`,
      { mobile_number, amount, network },
      { headers },
    );
    const success =
      mainRes?.receipt?.trans_Status === "success" ||
      mainRes?.receipt?.trans_Status === "processing";

    if (success) {
      await Transaction.updateOne(
        { trans_Id: transactionId },
        { $set: { trans_Status: "success", apiResponse: mainRes.msg || "" } },
      );
      const receipt = await Transaction.findOne({ trans_Id: transactionId });
      return res
        .status(200)
        .json({ msg: mainRes.msg || "Purchase successful", receipt });
    } else {
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: amountToCharge } },
      );
      await Transaction.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: "failed",
            trans_profit: 0,
            apiResponse: mainRes?.msg || "Failed",
          },
        },
      );
      await notify({
        title: "Purchase Failed",
        body: `Failed airtime purchase by ${user.userName} — ${
          mainRes?.msg || "unknown"
        }`,
        type: "failed",
        userId,
      });
      return res
        .status(500)
        .json({ msg: mainRes?.msg || "Transaction failed" });
    }
  } catch (error) {
    console.error("[buyAirtime]", error?.response?.data || error.message);
    if (balanceDeducted) {
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: amountToCharge } },
      ).catch(() => {});
    }
    if (transactionId) {
      await Transaction.updateOne(
        { trans_Id: transactionId },
        {
          $set: {
            trans_Status: "failed",
            trans_profit: 0,
            apiResponse: error?.response?.data?.msg || error.message || "Error",
          },
        },
      ).catch(() => {});
    }
    return res
      .status(500)
      .json({ msg: error?.response?.data?.msg || "Transaction failed" });
  }
};

const buyElectricity = async (req, res) => {
  const { userId } = req.user;
  const { meterId, meterNumber, amount, meterType } = req.body;
  if (!meterId || !meterNumber || !amount || !meterType)
    return res.status(400).json({ msg: "All fields are required" });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isSuspended)
      return res.status(403).json({ msg: "Account suspended" });

    const amountToCharge = parseFloat(amount) + 50;
    if (user.balance < amountToCharge)
      return res
        .status(400)
        .json({ msg: "Insufficient balance. Kindly fund your wallet" });

    const { url, headers } = await getMainPlatformClient();
    await User.updateOne(
      { _id: userId },
      { $inc: { balance: -amountToCharge } },
    );

    const { data: mainRes } = await axios.post(
      `${url}/buy/electricity`,
      req.body,
      { headers },
    );

    if (mainRes?.token) {
      return res.status(200).json({ msg: mainRes.msg, token: mainRes.token });
    } else {
      await User.updateOne(
        { _id: userId },
        { $inc: { balance: amountToCharge } },
      );
      await notify({
        title: "Purchase Failed",
        body: `Failed electricity purchase by ${user.userName}`,
        type: "failed",
        userId,
      });
      return res
        .status(500)
        .json({ msg: mainRes?.msg || "Transaction failed" });
    }
  } catch (error) {
    console.error("[buyElectricity]", error?.response?.data || error.message);
    return res
      .status(500)
      .json({ msg: error?.response?.data?.msg || "Transaction failed" });
  }
};

const buyCable = async (req, res) => {
  const { userId } = req.user;
  const { cableType, cablePlan, smartCardNumber } = req.body;
  if (!cableType || !cablePlan || !smartCardNumber)
    return res.status(400).json({ msg: "All fields are required" });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isSuspended)
      return res.status(403).json({ msg: "Account suspended" });

    const { url, headers } = await getMainPlatformClient();

    // Fetch price from main platform plan list — or pass through
    const { data: mainRes } = await axios.post(`${url}/buy/cable`, req.body, {
      headers,
    });

    if (mainRes?.receipt || mainRes?.msg?.toLowerCase().includes("success")) {
      return res
        .status(200)
        .json({ msg: mainRes.msg, receipt: mainRes.receipt });
    } else {
      return res
        .status(500)
        .json({ msg: mainRes?.msg || "Transaction failed" });
    }
  } catch (error) {
    console.error("[buyCable]", error?.response?.data || error.message);
    return res
      .status(500)
      .json({ msg: error?.response?.data?.msg || "Transaction failed" });
  }
};

const validateMeter = async (req, res) => {
  try {
    const { url, headers } = await getMainPlatformClient();
    const { data } = await axios.post(`${url}/buy/validatemeter`, req.body, {
      headers,
    });
    res.status(200).json(data);
  } catch (error) {
    console.error("[validateMeter]", error?.response?.data || error.message);
    res
      .status(error?.response?.status || 500)
      .json({ msg: error?.response?.data?.msg || "Unable to validate meter" });
  }
};

const fetchDiscos = async (req, res) => {
  try {
    const { url, headers } = await getMainPlatformClient();
    const { data } = await axios.get(`${url}/buy/fetchDiscos`, { headers });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ msg: "Unable to fetch discos" });
  }
};

module.exports = {
  buyData,
  buyAirtime,
  buyElectricity,
  buyCable,
  validateMeter,
  fetchDiscos,
};
