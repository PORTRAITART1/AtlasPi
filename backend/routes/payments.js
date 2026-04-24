import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import { validateAccessToken } from "../utils/auth.js";
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

        logger.info(`Payment approved by ${req.user.username}: local=${localPaymentId}, pi=${paymentId}`);

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

        logger.info(`Payment completed by ${req.user.username}: local=${localPaymentId}, txid=${txid}`);

        return res.json({
          ok: true,
          status: "completed",
          localPaymentId,
          paymentId,
          txid
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

router.get("/list", (req, res) => {
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

export default router;
