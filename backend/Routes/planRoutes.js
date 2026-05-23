const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const { getPlans, getPublicPlans } = require("../Controllers/planController");

router.get("/public", getPublicPlans);
router.get("/", auth, getPlans);

module.exports = router;
