import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import { validateAccessToken } from "../utils/auth.js";
import { requireAdminSecret } from "../middlewares/adminAuth.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.post("/create-record", (req, res) => {
  try {
    const { uid, username, amount, memo, metadata } = req.body;

    if (!uid || !username || !amount) {
      logger.error("Payment record creation failed: missing fields");
      return res.status(400).json({
        ok: false,
        error: "uid, username and amount are required"
      });
    }

    const localPaymentId = uuidv4();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO payments
      (local_payment_id, uid, username, amount, memo, status, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localPaymentId,
        uid,
        username,
        amount,
        memo || "",
        "created",
        JSON.stringify(metadata || {}),
        now,
        now
      ],
      function (err) {
        if (err) {
          logger.error("DB insert payment error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error"
          });
        }

        logger.info(`Payment record created: ${localPaymentId}`);

        return res.json({
          ok: true,
          localPaymentId,
          status: "created"
        });
      }
    );
  } catch (error) {
    logger.error("Create payment record error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/approve", (req, res) => {
  try {
    const { localPaymentId, paymentId } = req.body;

    if (!localPaymentId || !paymentId) {
      logger.error("Approve payment failed: missing ids");
      return res.status(400).json({
        ok: false,
        error: "localPaymentId and paymentId are required"
      });
    }

    const now = new Date().toISOString();

    db.run(
      `UPDATE payments
       SET pi_payment_id = ?, status = ?, updated_at = ?
       WHERE local_payment_id = ?`,
      [paymentId, "approved", now, localPaymentId],
      function (err) {
        if (err) {
          logger.error("Approve update DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error"
          });
        }

        logger.info(`Payment approved: local=${localPaymentId}, pi=${paymentId}`);

        return res.json({
          ok: true,
          status: "approved",
          localPaymentId,
          paymentId
        });
      }
    );
  } catch (error) {
    logger.error("Approve route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/complete", (req, res) => {
  try {
    const { localPaymentId, paymentId, txid } = req.body;

    if (!localPaymentId || !paymentId || !txid) {
      logger.error("Complete payment failed: missing fields");
      return res.status(400).json({
        ok: false,
        error: "localPaymentId, paymentId and txid are required"
      });
    }

    const now = new Date().toISOString();

    db.run(
      `UPDATE payments
       SET pi_payment_id = ?, txid = ?, status = ?, updated_at = ?
       WHERE local_payment_id = ?`,
      [paymentId, txid, "completed", now, localPaymentId],
      function (err) {
        if (err) {
          logger.error("Complete update DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error"
          });
        }

        logger.info(`Payment completed: local=${localPaymentId}, txid=${txid}`);

        // ✅ Activate VIP if uid provided
        const { uid, username } = req.body;
        if (uid) {
          const vipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          const nowVip = new Date().toISOString();
          db.run(
            `INSERT INTO users (uid, username, is_vip, vip_expires_at, vip_payment_id, vip_txid, created_at, updated_at)
             VALUES (?, ?, 1, ?, ?, ?, ?, ?)
             ON CONFLICT(uid) DO UPDATE SET
               is_vip = 1,
               vip_expires_at = ?,
               vip_payment_id = ?,
               vip_txid = ?,
               updated_at = ?`,
            [uid, username || 'unknown', vipExpiry, paymentId, txid, nowVip, nowVip,
             vipExpiry, paymentId, txid, nowVip],
            (vipErr) => {
              if (vipErr) logger.error('VIP activation error: ' + vipErr.message);
              else logger.info(`VIP activated for ${uid} until ${vipExpiry}`);
            }
          );
        }

        return res.json({
          ok: true,
          status: "completed",
          localPaymentId,
          paymentId,
          txid,
          vipActivated: !!uid
        });
      }
    );
  } catch (error) {
    logger.error("Complete route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/list", requireAdminSecret, (req, res) => {
  db.all(
    `SELECT * FROM payments ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        logger.error("List payments DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error"
        });
      }

      return res.json({
        ok: true,
        count: rows.length,
        payments: rows
      });
    }
  );
});

// GET /api/payments/vip-users (admin)
router.get("/vip-users", requireAdminSecret, (req, res) => {
  db.all(
    `SELECT uid, username, is_vip, vip_expires_at, vip_payment_id, vip_txid, created_at
     FROM users
     WHERE is_vip = 1
     ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, error: "DB error" });
      }
      return res.json({
        ok: true,
        count: rows.length,
        users: rows
      });
    }
  );
});

// GET /api/payments/network/info
router.get("/network/info", (req, res) => {
  const network = process.env.PI_NETWORK || "mainnet";
  const api = network === "testnet"
    ? "https://api-testnet.minepi.com"
    : "https://api.minepi.com";

  return res.json({
    ok: true,
    network,
    api,
    hasServerKey: !!process.env.PI_API_KEY,
    mode: process.env.APP_MODE || "pirc2-production"
  });
});

// GET /api/payments/user/status?uid=xxx
router.get("/user/status", (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ ok: false, error: "uid is required" });
  }

  db.get(
    `SELECT uid, username, is_vip, vip_expires_at, vip_payment_id FROM users WHERE uid = ?`,
    [uid],
    (err, row) => {
      if (err) {
        return res.status(500).json({ ok: false, error: "DB error" });
      }

      if (!row) {
        return res.json({
          ok: true,
          uid,
          isVIP: false,
          vipExpiry: null,
          message: "User not found — not VIP"
        });
      }

      const now = new Date();
      const expiry = row.vip_expires_at ? new Date(row.vip_expires_at) : null;
      const isVIPActive = row.is_vip === 1 && expiry && expiry > now;

      return res.json({
        ok: true,
        uid: row.uid,
        username: row.username,
        isVIP: isVIPActive,
        vipExpiry: row.vip_expires_at,
        message: isVIPActive ? "✅ VIP active" : "❌ VIP not active"
      });
    }
  );
});

export default router;
