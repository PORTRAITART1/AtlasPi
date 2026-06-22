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
import supportRoutes from "./routes/support.js";
import envManager from "./config/envManager.js";
import pirc2SubscriptionsRoutes from "./routes/pirc2-subscriptions.js";

const app = express();
const PORT = envManager.get('port', 3000);
const PI_API_KEY = process.env.PI_API_KEY;

// Behind a reverse proxy (Render / K8s / nginx): trust the first proxy hop so
// rate limiting keys on the real client IP instead of the proxy's IP.
app.set('trust proxy', 1);

// Log startup info
logger.info(`\n${'='.repeat(60)}`);
logger.info(`AtlasPi Backend Started`);
logger.info(`Mode: ${envManager.getModeInfo().mode.toUpperCase()}`);
logger.info(`Description: ${envManager.getModeInfo().description}`);
logger.info(`${'='.repeat(60)}\n`);

app.use(helmet());

// CORS Configuration
// Whitelist des origins autorisés à faire des requêtes
// - FRONTEND_URL : frontend réel (Docker port 8080)
// - FRONTEND_APP_URL : alternative future (ex: Vite dev sur 5173)
const corsOrigins = [envManager.get('frontendUrl')];
const frontendAppUrl = envManager.get('frontendAppUrl');
if (frontendAppUrl) {
  corsOrigins.push(frontendAppUrl);
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_APP_URL,
  "https://atlaspi-frontend.onrender.com"
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-secret", "x-demo-user-id", "x-demo-access-token"],
  credentials: false
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const rateLimitMessage = {
  ok: false,
  error: "Too many requests. Please try again later."
};

const windowMs = envManager.get('rateLimitWindowMs', 15 * 60 * 1000);

// Global catch-all limiter. Health checks are exempt so probes never consume it.
const globalLimiter = rateLimit({
  windowMs,
  max: envManager.get('rateLimitMaxRequests', 100),
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/" || req.path === "/api/health"
});

// Strict limiter for authentication (brute-force / token stuffing).
const authLimiter = rateLimit({
  windowMs,
  max: envManager.get('authRateLimitMaxRequests', 20),
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false
});

// Limiter for state-changing requests on data routes (writes only; reads pass).
const writeLimiter = rateLimit({
  windowMs,
  max: envManager.get('writeRateLimitMaxRequests', 40),
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false
});

// Applies a limiter only to non-GET (mutating) requests.
const writesOnly = (limiter) => (req, res, next) =>
  req.method === "GET" ? next() : limiter(req, res, next);

app.use(globalLimiter);

app.get("/", (req, res) => {
  const modeInfo = envManager.getModeInfo();
  res.json({
    ok: true,
    app: "AtlasPi API",
    status: "running",
    mode: modeInfo.mode,
    description: modeInfo.description,
    features: {
      pirc2Auth: envManager.get('pirc2AuthEnabled', false),
      pirc2Payments: envManager.get('pirc2PaymentsEnabled', false),
      pirc2MerchantPi: envManager.get('pirc2MerchantPiEnabled', false),
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
      pirc2MerchantPi: envManager.get("pirc2MerchantPiEnabled", false),
    },
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    message: "AtlasPi backend is healthy"
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/payments", writesOnly(writeLimiter), paymentRoutes);
app.use("/api/pi-payments", writesOnly(writeLimiter), piPaymentRoutes);
app.use("/api/subscriptions", writesOnly(writeLimiter), subscriptionRoutes);
app.use("/api/merchant-listings", writesOnly(writeLimiter), merchantListingRoutes);
app.use("/api/support", writesOnly(writeLimiter), supportRoutes);
app.use("/api/pirc2/services", writesOnly(writeLimiter), pirc2ServicesRoutes);
app.use("/api/pirc2/subscriptions", writesOnly(writeLimiter), pirc2SubscriptionsRoutes);
app.use((err, req, res, next) => {
  logger.error("Unhandled server error: " + err.message);
  res.status(500).json({
    ok: false,
    error: "Internal server error"
  });
});

app.listen(PORT, () => {
  logger.info(`AtlasPi backend started on port ${PORT}`);
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
