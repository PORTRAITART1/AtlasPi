import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import pirc2ServicesRoutes from "./routes/pirc2-services.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import piPaymentRoutes from "./routes/payments-pi-day3.js";
import logger from "./utils/logger.js";
import merchantListingRoutes from "./routes/merchantListings.js";
import notificationsRouter from "./routes/notifications.js";
import supportRoutes from "./routes/support.js";
import envManager from "./config/envManager.js";
import pirc2SubscriptionsRoutes from "./routes/pirc2-subscriptions.js";
import authPiRoutes from "./routes/auth-pi.js";
// ✅ AJOUT BioWallet
import session from "express-session";

const bioWalletRoutes = require('./modules/biowallet/routes/BioWalletRoutes');
const app = express();
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("=== DEBUG PATH ===");
console.log("__dirname:", __dirname);
console.log("Frontend path:", path.join(__dirname, "../frontend"));
console.log("==================");

const PORT = envManager.get("port", 3000);
const PI_API_KEY = process.env.PI_API_KEY;

// Log startup info
logger.info(`\n${"=".repeat(60)}`);
logger.info("AtlasPi Backend Started");
logger.info(`Mode: ${envManager.getModeInfo().mode.toUpperCase()}`);
logger.info(`Description: ${envManager.getModeInfo().description}`);
logger.info(`${"=".repeat(60)}\n`);

app.use(helmet());

// ✅ Session configuration
app.use(session({
secret: process.env.JWT_SECRET || "atlaspi-session-secret",
resave: false,
saveUninitialized: false,
cookie: {
secure: process.env.NODE_ENV === "production",
httpOnly: true,
sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
maxAge: 24 * 60 * 60 * 1000
}
}));

// ✅ CORS Configuration - Pi Browser + Pi Network compatible
const allowedOrigins = [
"http://localhost:3000",
"http://127.0.0.1:3000",
"http://localhost:5173",
"http://192.168.11.100:3000",
"http://127.0.0.1:5173",
envManager.get("frontendUrl"),
envManager.get("frontendAppUrl"),
process.env.FRONTEND_URL,
process.env.FRONTEND_APP_URL,
"https://atlaspi-frontend.onrender.com",
"https://atlaspicdb0125.pinet.com",
"https://app-cdn.minepi.com",
"https://minepi.com",
"https://pi.app"
].filter(Boolean);

// ✅ Supprime les doublons
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(cors({
origin: function (origin, callback) {
// Autorise curl, Postman, apps mobiles, Pi Browser, ou requêtes sans Origin
if (!origin) {
return callback(null, true);
}
// ✅ Autorise toutes les origines Pi Network / Pi Browser
if (
origin.includes("minepi.com") ||
origin.includes("pi.app") ||
origin.includes("pinet.com")
) {
return callback(null, true);
}
if (uniqueAllowedOrigins.includes(origin)) {
return callback(null, true);
}
console.warn("[CORS BLOCKED]", origin);
return callback(new Error("Not allowed by CORS"));
},
methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
allowedHeaders: [
"Content-Type",
"Authorization",
"X-Admin-Secret",
"x-admin-secret",
"X-Demo-User-Id",
"x-demo-user-id",
"X-Demo-Access-Token",
"x-demo-access-token",
"X-Pi-App-Api-Key",
"x-pi-app-api-key",
"X-Requested-With",
"Accept",
"Origin"
],
credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ✅ Frontend statique après CORS
app.use(express.static(path.join(__dirname, "../frontend")));

const limiter = rateLimit({
windowMs: envManager.get("rateLimitWindowMs", 15 * 60 * 1000),
max: envManager.get("rateLimitMaxRequests", 100),
message: {
ok: false,
error: "Too many requests. Please try again later."
}
});
app.use(limiter);

app.get("/", (req, res) => {
const modeInfo = envManager.getModeInfo();
res.json({
ok: true,
app: "AtlasPi API",
status: "running",
mode: modeInfo.mode,
description: modeInfo.description,
features: {
pirc2Auth: envManager.get("pirc2AuthEnabled", false),
pirc2Payments: envManager.get("pirc2PaymentsEnabled", false),
pirc2MerchantPi: envManager.get("pirc2MerchantPiEnabled", false)
}
});
});

app.get("/api/health", (req, res) => {
const modeInfo = envManager.getModeInfo();
const network = process.env.PI_NETWORK || "mainnet";
res.json({
ok: true,
status: "running",
mode: modeInfo.mode,
network,
api: network === "testnet"
? "https://api-testnet.minepi.com"
: "https://api.minepi.com",
features: {
pirc2Auth: envManager.get("pirc2AuthEnabled", false),
pirc2Payments: envManager.get("pirc2PaymentsEnabled", false),
pirc2MerchantPi: envManager.get("pirc2MerchantPiEnabled", false)
},
version: "1.0.0",
timestamp: new Date().toISOString(),
message: "AtlasPi backend is healthy"
});
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/pi", authPiRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/pi-payments", piPaymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/merchant-listings", merchantListingRoutes);
app.use("/api/notifications", notificationsRouter);
app.use("/api/support", supportRoutes);
app.use("/api/pirc2/services", pirc2ServicesRoutes);
app.use("/api/pirc2/subscriptions", pirc2SubscriptionsRoutes);
// ✅ AJOUT Route BioWallet

// ✅ Gestion d'erreurs
app.use((err, req, res, next) => {
logger.error("Unhandled server error: " + err.message);
res.status(500).json({
ok: false,
error: "Internal server error"
});
});
app.use('/api/wallet', bioWalletRoutes);
app.listen(PORT, '0.0.0.0', () => {
logger.info(`AtlasPi backend started on port ${PORT}`);
console.log(`✅ Server running on http://localhost:${PORT}`);
});