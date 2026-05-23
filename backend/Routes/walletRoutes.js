const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const { monnifyWebhook, initiateFunding, createReservedAccount, createBillStackAccount, billStackWebhook } = require("../Controllers/walletController");

router.post("/monnify", monnifyWebhook);
router.post("/billstack", billStackWebhook);
router.post("/fund", auth, initiateFunding);
router.post("/reserved-account", auth, createReservedAccount);
router.post("/billstack-account", auth, createBillStackAccount);

module.exports = router;
