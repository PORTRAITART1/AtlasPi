const path = require("path");
const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger.js");
const authPiRoutes = require("./routes/auth-pi.js");
const paymentRoutes = require("./routes/payments.js");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Configuration CORS élargie pour Pi Browser
const allowedOrigins = [
    'https://atlaspi.onrender.com',
    'https://atlaspi-frontend.onrender.com',
    'https://atlaspi-backend.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://app-cdn.minepi.com',
    'https://minepi.com',
    'https://pi.app',
    'https://api.minepi.com',
    'https://pi-browser.minepi.com',
    'https://pi-network.minepi.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permettre les requêtes sans origin (curl, postman)
        if (!origin) return callback(null, true);
        
        // Vérifier si l'origine est autorisée
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Autoriser toutes les sous-domaines de minepi.com et pi.app
        if (origin.includes('minepi.com') || origin.includes('pi.app') || origin.includes('pinet.com')) {
            return callback(null, true);
        }
        
        console.warn('[CORS] Blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Pi-App-API-Key']
}));

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
