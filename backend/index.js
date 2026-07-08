require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

// Import modularized configurations
const connectDB = require("./config/db");
const setupSockets = require("./sockets/trackingSocket");
const startCronJobs = require("./jobs/donationJobs");

// Initialize App
const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

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

// Global Error Handler (Catches unhandled errors in routes)
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Initialize WebSockets
setupSockets(server, corsOptions);

// Start Background Jobs
startCronJobs();

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`ResQPlate server running on port ${PORT}`);
});
