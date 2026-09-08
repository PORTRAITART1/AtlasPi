const path = require("path");
const express = require("express");
const logger = require("./utils/logger.js");
const authPiRoutes = require("./routes/auth-pi.js");
const paymentRoutes = require("./routes/payments.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());

// Log startup info
logger.info(`\n${"=".repeat(60)}`);
logger.info("AtlasPi Backend Started");
logger.info(`${"=".repeat(60)}\n`);

console.log("=== DEBUG PATH ===");
console.log("__dirname:", __dirname);
console.log("==================");

// Routes
app.use("/api/auth/pi", authPiRoutes);
app.use("/api/payments", paymentRoutes);

// Simple routes
app.get("/", (req, res) => {
    res.json({
        ok: true,
        app: "AtlasPi API",
        status: "running",
        version: "1.0.0",
        routes: {
            auth_pi: "/api/auth/pi",
            payments: "/api/payments"
        }
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        status: "running",
        mode: process.env.APP_MODE || "pirc2-sandbox",
        timestamp: new Date().toISOString()
    });
});

// Health check for Render
app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`AtlasPi backend started on port ${PORT}`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
