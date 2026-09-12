const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger.js");
const authPiRoutes = require("./routes/auth-pi.js");
const paymentRoutes = require("./routes/payments.js");
const piPaymentRoutes = require("./routes/payments-pi.js");
const { seedMerchants } = require("./seed/merchants.js");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
    'https://atlaspi.onrender.com',
    'https://atlaspi-frontend.onrender.com',
    'https://atlaspi-backend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://app-cdn.minepi.com',
    'https://minepi.com',
    'https://pi.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (origin.includes('minepi.com') || origin.includes('pi.app') || origin.includes('pinet.com')) {
            return callback(null, true);
        }
        console.warn('[CORS] Blocked:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Pi-App-API-Key']
}));

app.use(express.json());

logger.info(`\n${"=".repeat(60)}`);
logger.info("AtlasPi Backend Started");
logger.info(`${"=".repeat(60)}\n`);

app.use("/api/auth/pi", authPiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/pi-payments", piPaymentRoutes);

app.get("/", (req, res) => {
    res.json({ ok: true, app: "AtlasPi API", status: "running", version: "1.0.0" });
});

app.get("/api/health", (req, res) => {
    res.json({ ok: true, status: "running", mode: process.env.APP_MODE || "pirc2-sandbox", timestamp: new Date().toISOString() });
});

// ✅ Seed des marchands de démonstration (une seule fois)
try {
const db = require("./config/db.js");
seedMerchants(db);
} catch (e) {
console.error("Seed error:", e.message);
}
app.get("/healthz", (req, res) => res.status(200).send("OK"));

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`AtlasPi backend started on port ${PORT}`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
