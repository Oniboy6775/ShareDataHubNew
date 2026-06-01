const Contact = require("../Models/contactModel");

const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user.userId }).sort({ lastUsed: -1 });
    res.status(200).json({ contacts });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const saveContact = async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ msg: "Phone is required" });
  try {
    await Contact.findOneAndUpdate(
      { userId: req.user.userId, phone },
      { name: name || "", lastUsed: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ msg: "Contact saved" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

const deleteContact = async (req, res) => {
  try {
    await Contact.deleteOne({ _id: req.params.id, userId: req.user.userId });
    res.status(200).json({ msg: "Contact deleted" });
  } catch (e) {
    res.status(500).json({ msg: "Something went wrong" });
  }
};

module.exports = { getContacts, saveContact, deleteContact };
