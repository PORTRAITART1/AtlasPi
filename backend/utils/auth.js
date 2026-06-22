import db from "../config/db.js";
import logger from "./logger.js";
import { hashToken, isTokenExpired } from "./tokens.js";

export const validateAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.error("Access denied: missing Authorization header");
    return res.status(403).json({
      ok: false,
      error: "Missing Authorization header"
    });
  }

  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    logger.error("Access denied: empty token");
    return res.status(403).json({
      ok: false,
      error: "Invalid Authorization header format"
    });
  }

  db.get(
    `SELECT * FROM auth_logs WHERE access_token = ? ORDER BY created_at DESC LIMIT 1`,
    [hashToken(token)],
    (err, row) => {
      if (err) {
        logger.error("Token validation DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error"
        });
      }

      if (!row) {
        logger.error("Access denied: invalid token");
        return res.status(403).json({
          ok: false,
          error: "Invalid access token"
        });
      }

      if (isTokenExpired(row.created_at)) {
        logger.warn(`Access denied: expired token for user ${row.uid}`);
        return res.status(403).json({
          ok: false,
          error: "Access token expired"
        });
      }

      // Attach user info to request for use in route handlers
      req.user = {
        uid: row.uid,
        username: row.username
      };

      next();
    }
  );
};

export default validateAccessToken;
