const Plan = require("../Models/planModel");
const User = require("../Models/userModel");

const getPlans = async (req, res) => {
  // planType param (from frontend) maps to plan.planType (SME, GIFTING etc.)
  const { network, planType, planCategory } = req.query;
  try {
    const user = req?.user?.userId ? await User.findById(req.user.userId) : null;
    const userType = user?.userType ?? "user";

    const query = { isAvailable: true };
    // case-insensitive network match so "MTN", "mtn", "Mtn" all work
    if (network && network !== "all")
      query.network = { $regex: new RegExp(`^${network}$`, "i") };
    if (planType && planType !== "all")
      query.planType = { $regex: new RegExp(`^${planType}$`, "i") };
    if (planCategory && planCategory !== "all")
      query.planCategory = { $regex: new RegExp(`^${planCategory}$`, "i") };

    const plans = await Plan.find(query).lean();
    const result = plans.map((plan) => {
      let price = plan.sellingPrice;
      if (user?.isSpecial && user.specialPrices?.length) {
        const sp = user.specialPrices.find((s) => s.planId === plan.planId);
        if (sp?.price) price = sp.price;
      } else if (userType === "reseller" && plan.resellerPrice) {
        price = plan.resellerPrice;
      } else if (userType === "api user" && plan.apiPrice) {
        price = plan.apiPrice;
      }
      return { ...plan, price, isHot: plan.isHot === true };
    });

    res.status(200).json({ plans: result });
  } catch (error) {
    console.error("[getPlans]", error.message);
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const getPublicPlans = async (req, res) => {
  try {
    const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
    const grouped = {};
    for (const network of networks) {
      const plans = await Plan.find({ network, isAvailable: true }).lean();
      const sorted = plans.sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || a.sellingPrice - b.sellingPrice);
      grouped[network] = sorted.slice(0, 5).map(({ planId, planName, planType, planCategory, sellingPrice, isHot }) => ({
        planId, planName, planType, planCategory, sellingPrice, isHot: !!isHot,
      }));
    }
    res.status(200).json({ plans: grouped });
  } catch (e) {
    res.status(500).json({ msg: 'Failed to load plans' });
  }
};

module.exports = { getPlans, getPublicPlans };
