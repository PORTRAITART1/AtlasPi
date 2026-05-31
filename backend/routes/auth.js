import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";

const router = express.Router();

router.post("/pi", (req, res) => {
  try {
    const { uid, username, accessToken, wallet_address } = req.body;

    if (!uid || !username || !accessToken) {
      logger.error("Auth failed: missing fields");
      return res.status(400).json({
        ok: false,
        error: "Missing required auth fields"
      });
    }

    const createdAt = new Date().toISOString();

    db.run(
      `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [uid, username, wallet_address || "", accessToken, createdAt],
      function (err) {
        if (err) {
          logger.error("Database error on auth log insert: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error"
          });
        }

        logger.info(`Auth success for user ${username} (${uid}) - token stored`);

        return res.json({
          ok: true,
          message: "Pi auth received and logged",
          user: {
            uid,
            username,
            wallet_address: wallet_address || null,
            access_token: accessToken
          }
        });
      }
    );
  } catch (error) {
    logger.error("Auth route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/profile/:uid", (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        ok: false,
        error: "uid is required"
      });
    }

    db.get(
      `SELECT uid, username, wallet_address, created_at
       FROM auth_logs
       WHERE uid = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [uid],
      (err, row) => {
        if (err) {
          logger.error("Profile fetch DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while loading profile"
          });
        }

        if (!row) {
          return res.status(404).json({
            ok: false,
            error: "Profile not found"
          });
        }

        return res.json({
          ok: true,
          profile: row
        });
      }
    );
  } catch (error) {
    logger.error("Profile route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});
export default router;
