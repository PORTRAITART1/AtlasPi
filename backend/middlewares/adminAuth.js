import logger from "../utils/logger.js";

const DEV_ADMIN_SECRET = "atlaspi-dev-secret-change-in-prod";

// Resolves the active admin secret. The development fallback is only used
// outside of production so the well-known dev secret can never grant access
// on a real deployment.
export function getAdminSecret() {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredSecret = process.env.ADMIN_SECRET;
  return configuredSecret || (!isProduction ? DEV_ADMIN_SECRET : null);
}

export function isValidAdminSecret(req) {
  const adminSecret = getAdminSecret();
  if (!adminSecret) {
    return false;
  }

  const headerSecret = req.headers["x-admin-secret"];
  return Boolean(headerSecret && headerSecret === adminSecret);
}

export function requireAdminSecret(req, res, next) {
  const adminSecret = getAdminSecret();

  if (!adminSecret) {
    logger.error("Admin auth rejected: ADMIN_SECRET is not configured");
    return res.status(500).json({
      ok: false,
      error: "Server admin authentication is not configured."
    });
  }

  const headerSecret = req.headers["x-admin-secret"];

  if (!headerSecret || headerSecret !== adminSecret) {
    logger.warn("Admin auth rejected: invalid or missing admin secret");
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Invalid or missing admin secret."
    });
  }

  return next();
}
