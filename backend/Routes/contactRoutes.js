const express = require("express");
const router = express.Router();
const auth = require("../Middleware/auth");
const { getContacts, saveContact, deleteContact } = require("../Controllers/contactController");

router.use(auth);
router.get("/", getContacts);
router.post("/", saveContact);
router.delete("/:id", deleteContact);

module.exports = router;
