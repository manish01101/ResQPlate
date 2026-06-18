const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();

// Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));

// Health check
app.get("/", (req, res) =>
  res.json({ message: "ResQPlate API running", version: "1.0.0" }),
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });

// Cron job: Auto-expire donations every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  const Donation = require("./models/donation");
  const result = await Donation.updateMany(
    { status: "available", expiry_datetime: { $lt: new Date() } },
    { $set: { status: "expired", expiredAt: new Date() } }, // Track exactly when it expired
  );
  if (result.modifiedCount > 0) {
    console.log(`[CRON] Auto-expired ${result.modifiedCount} donation(s)`);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ResQPlate server running on port ${PORT}`));
