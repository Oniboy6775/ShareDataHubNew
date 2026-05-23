require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api/plans", require("./Routes/planRoutes"));
app.use("/api/buy", require("./Routes/purchaseRoutes"));
app.use("/api/webhook", require("./Routes/walletRoutes"));
app.use("/api/wallet", require("./Routes/walletRoutes"));
app.use("/api/admin", require("./Routes/adminRoutes"));

// Public — active broadcasts shown to all logged-in users as banners
const { getActiveBroadcasts } = require("./Routes/adminRoutes");
app.get("/api/broadcasts", getActiveBroadcasts);

// Public — theme overrides (safe, no secrets)
const { getPublicTheme } = require("./Controllers/adminController");
app.get("/api/theme", getPublicTheme);

const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => res.sendFile(path.join(frontendDist, "index.html")));

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected");
    app.listen(PORT, () => console.log(`Affiliate backend running on port ${PORT}`));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

start();
