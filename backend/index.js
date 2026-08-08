require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

// Import modularized configurations
const connectDB = require("./config/db");
const wsHub = require("./sockets/wsServer");
const startCronJobs = require("./jobs/donationJobs");

// --- Fail-fast env validation (never boot half-configured) ---
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(
    `[BOOT] Missing required environment variables: ${missingEnv.join(", ")}`,
  );
  process.exit(1);
}

// Initialize App
const app = express();
const server = http.createServer(app);

// Friendlier startup errors (e.g. port already in use) instead of a raw crash
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[BOOT] Port ${process.env.PORT || 8080} is already in use (EADDRINUSE). ` +
        "Stop the running backend instance or set PORT in your .env to a different value.",
    );
  } else {
    console.error("[BOOT] Server error:", err);
  }
  process.exit(1);
});

// Connect to Database
connectDB();

// Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- Request logging with a per-request ID ---
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.error(
        `[req] ${requestId} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
      );
    } else {
      console.log(
        `[req] ${requestId} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
      );
    }
  });
  next();
});

// Global API rate limiting
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  }),
);

// Stricter limit for authentication endpoints
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many auth attempts, please try again later.",
    },
  }),
);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/donations", require("./routes/donations"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/bot", require("./routes/bot"));

// Health check — readiness for load balancers / uptime monitors
app.get("/", (req, res) =>
  res.json({ message: "ResQPlate API running", version: "1.0.0" }),
);
app.get("/health", (req, res) => {
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"][
    require("mongoose").connection.readyState
  ];
  res.status(dbState === "connected" ? 200 : 503).json({
    status: dbState === "connected" ? "ok" : "degraded",
    db: dbState,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler (Catches unhandled errors in routes)
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Initialize WebSockets (raw `ws`, no Socket.io)
wsHub.start(server);

// Start Background Jobs
startCronJobs();

// --- Crash handlers: log loudly, then exit so the process manager restarts ---
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err.stack || err);
  gracefulShutdown("uncaughtException");
});

let shuttingDown = false;
function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[SHUTDOWN] ${signal} received, closing gracefully...`);

  const forceTimer = setTimeout(() => {
    console.error("[SHUTDOWN] Forced exit after 10s.");
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  wsHub.stop();
  server.close(async () => {
    try {
      await require("mongoose").disconnect();
      console.log("[SHUTDOWN] Server and DB closed cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("[SHUTDOWN] Error during disconnect:", err.message);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`ResQPlate server running on port ${PORT}`);
});
