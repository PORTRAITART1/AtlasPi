import logger from "../utils/logger.js";

const DEV_ADMIN_SECRET = "atlaspi-dev-secret-change-in-prod";

export function requireAdminSecret(req, res, next) {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredSecret = process.env.ADMIN_SECRET;
  const adminSecret = configuredSecret || (!isProduction ? DEV_ADMIN_SECRET : null);
  const headerSecret = req.headers["x-admin-secret"];

  if (!adminSecret) {
    logger.error("Admin auth rejected: ADMIN_SECRET is not configured");
    return res.status(500).json({
      ok: false,
      error: "Server admin authentication is not configured."
    });
  }

  if (!headerSecret || headerSecret !== adminSecret) {
    logger.warn("Admin auth rejected: invalid or missing admin secret");
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Invalid or missing admin secret."
    });
  }

  return next();
}
