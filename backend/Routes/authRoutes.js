const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const {
  register, login, getProfile, changePassword,
  generateApiKey, updateProfile, redeemCoupon, getTransactions,
  forgotPassword, resetPassword, setPin, removePin,
} = require("../Controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/set-pin", auth, setPin);
router.post("/remove-pin", auth, removePin);
router.get("/profile", auth, getProfile);
router.patch("/profile", auth, updateProfile);
router.post("/change-password", auth, changePassword);
router.post("/generate-api-key", auth, generateApiKey);
router.post("/redeem-coupon", auth, redeemCoupon);
router.get("/transactions", auth, getTransactions);

module.exports = router;
