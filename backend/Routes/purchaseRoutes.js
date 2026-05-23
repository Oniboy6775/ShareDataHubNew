const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const { buyData, buyAirtime, buyElectricity, buyCable, validateMeter, fetchDiscos } = require("../Controllers/purchaseController");

router.post("/data", auth, buyData);
router.post("/airtime", auth, buyAirtime);
router.post("/electricity", auth, buyElectricity);
router.post("/cable", auth, buyCable);
router.post("/validateMeter", auth, validateMeter);
router.get("/fetchDiscos", fetchDiscos);

module.exports = router;
