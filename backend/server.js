import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import subscriptionRoutes from "./routes/subscriptions.js";
import logger from "./utils/logger.js";
import merchantListingRoutes from "./routes/merchantListings.js";
import envManager from "./config/envManager.js";

const app = express();
const PORT = envManager.get('port', 3000);

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

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-admin-secret",
    "x-demo-user-id",
    "x-demo-access-token"
  ],
  credentials: false
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: envManager.get('rateLimitWindowMs', 15 * 60 * 1000),
  max: envManager.get('rateLimitMaxRequests', 100),
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
      pirc2Auth: envManager.get('pirc2AuthEnabled', false),
      pirc2Payments: envManager.get('pirc2PaymentsEnabled', false),
      pirc2MerchantPi: envManager.get('pirc2MerchantPiEnabled', false),
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "AtlasPi backend is healthy"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/merchant-listings", merchantListingRoutes);

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
