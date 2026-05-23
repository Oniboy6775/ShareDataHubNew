const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const isAdmin = require("../Middleware/isAdmin");
const {
  getUsers, updateUser, creditUser, setSpecialPricing,
  getTransactions, refundTransaction,
  getAdminPlans, updatePlanPrice, syncPlans,
  generateCoupon, listCoupons,
  getNotifications, markNotificationsRead, getUnreadCount,
  getSettings, updateSettings,
  getDashboardSummary, getProfitAnalytics,
  createBroadcast, getBroadcasts, getActiveBroadcasts, toggleBroadcast, deleteBroadcast,
  resetUserPin, resetUserPassword,
} = require("../Controllers/adminController");

router.use(auth, isAdmin);

router.get("/dashboard", getDashboardSummary);
router.get("/analytics/profit", getProfitAnalytics);

router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.post("/users/credit", creditUser);
router.patch("/users/:id/special-pricing", setSpecialPricing);
router.post("/users/:id/reset-pin", resetUserPin);
router.post("/users/:id/reset-password", resetUserPassword);

router.get("/transactions", getTransactions);
router.post("/transactions/refund", refundTransaction);

router.get("/plans", getAdminPlans);
router.patch("/plans/:id", updatePlanPrice);
router.post("/plans/sync", syncPlans);

router.post("/coupons/generate", generateCoupon);
router.get("/coupons", listCoupons);

router.get("/notifications", getNotifications);
router.patch("/notifications/read", markNotificationsRead);
router.get("/notifications/unread-count", getUnreadCount);

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

router.post("/broadcasts", createBroadcast);
router.get("/broadcasts", getBroadcasts);
router.patch("/broadcasts/:id/toggle", toggleBroadcast);
router.delete("/broadcasts/:id", deleteBroadcast);

module.exports = router;
module.exports.getActiveBroadcasts = getActiveBroadcasts;
