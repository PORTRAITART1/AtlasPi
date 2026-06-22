import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import axios from "axios";
import { hashToken } from "../utils/tokens.js";

const router = express.Router();

router.post("/pi", async (req, res) => {
  try {
    const { uid, username, accessToken, wallet_address } = req.body;

    if (!uid || !username || !accessToken) {
      logger.error("Auth failed: missing fields");
      return res.status(400).json({
        ok: false,
        error: "Missing required auth fields"
      });
    }

    let me;
    try {
      const meResponse = await axios.get("https://api.minepi.com/v2/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        timeout: 15000
      });

      me = meResponse.data;
    } catch (verifyError) {
      logger.error("Pi /me verification failed: " + verifyError.message);
      return res.status(401).json({
        ok: false,
        error: "Pi token verification failed"
      });
    }

    if (!me || !me.uid) {
      logger.error("Pi /me verification returned invalid response");
      return res.status(401).json({
        ok: false,
        error: "Invalid Pi identity response"
      });
    }

    if (me.uid !== uid) {
      logger.error(`Auth uid mismatch: frontend=${uid}, pi=${me.uid}`);
      return res.status(401).json({
        ok: false,
        error: "UID mismatch after Pi verification"
      });
    }

    if (me.username && username && me.username !== username) {
      logger.error(`Auth username mismatch: frontend=${username}, pi=${me.username}`);
      return res.status(401).json({
        ok: false,
        error: "Username mismatch after Pi verification"
      });
    }

    const verifiedUsername = me.username || username;
    const createdAt = new Date().toISOString();
    const accessTokenHash = hashToken(accessToken);

    db.run(
      `INSERT INTO auth_logs (uid, username, wallet_address, access_token, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [me.uid, verifiedUsername, wallet_address || "", accessTokenHash, createdAt],
      function (err) {
        if (err) {
          logger.error("Database error on auth log insert: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error"
          });
        }

        logger.info(`Auth verified with Pi /me for user ${verifiedUsername} (${me.uid})`);

        // Upsert user in users table
        db.run(
          `INSERT INTO users (uid, username, wallet_address, is_vip, created_at, updated_at)
           VALUES (?, ?, ?, 0, ?, ?)
           ON CONFLICT(uid) DO UPDATE SET
             username = ?,
             wallet_address = ?,
             updated_at = ?`,
          [me.uid, verifiedUsername, wallet_address || "", createdAt, createdAt,
           verifiedUsername, wallet_address || "", createdAt],
          (upsertErr) => {
            if (upsertErr) logger.error("User upsert error: " + upsertErr.message);
          }
        );

        // Check VIP status
        db.get(
          `SELECT is_vip, vip_expires_at FROM users WHERE uid = ?`,
          [me.uid],
          (vipErr, vipRow) => {
            const now = new Date();
            const expiry = vipRow && vipRow.vip_expires_at ? new Date(vipRow.vip_expires_at) : null;
            const isVIP = vipRow && vipRow.is_vip === 1 && expiry && expiry > now;

            return res.json({
              ok: true,
              message: "Pi auth verified and logged",
              user: {
                uid: me.uid,
                username: verifiedUsername,
                wallet_address: wallet_address || null,
                isVIP: !!isVIP,
                vipExpiry: vipRow ? vipRow.vip_expires_at : null
              }
            });
          }
        );
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
