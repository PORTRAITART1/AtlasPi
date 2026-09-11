/**
 * Pi Network Payments (approval + completion)
 */

const express = require("express");
const db = require("../config/db.js");
const logger = require("../utils/logger.js");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();
const PI_API_BASE_URL = process.env.PI_API_BASE_URL || "https://api.minepi.com";

function getPiApiKey() {
  return process.env.PI_API_KEY || process.env.PI_SERVER_API_KEY;
}

router.post("/approve-pi-real", async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ ok: false, error: "Missing paymentId" });

    const piApiKey = getPiApiKey();
    if (!piApiKey) return res.status(500).json({ ok: false, error: "Pi API key not configured" });

    logger.info(`[PiPayment] Approving: ${paymentId}`);

    const response = await fetch(`${PI_API_BASE_URL}/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${piApiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`[PiPayment] Approve failed: ${response.status} ${errText}`);
      return res.status(500).json({ ok: false, error: `Pi API approve failed: ${response.status}` });
    }

    const now = new Date().toISOString();
    try {
      db.prepare(`UPDATE payments SET status = 'approved', pi_payment_id = ?, approved_at = ? WHERE local_payment_id = ? OR pi_payment_id = ?`).run(paymentId, now, paymentId, paymentId);
    } catch (e) { logger.warn(`DB update: ${e.message}`); }

    logger.info(`[PiPayment] Approved ✅: ${paymentId}`);
    res.json({ ok: true, paymentId, status: "approved" });
  } catch (err) {
    logger.error(`[PiPayment] Approve error: ${err.message}`);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/complete-pi-real", async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    if (!paymentId || !txid) return res.status(400).json({ ok: false, error: "Missing paymentId or txid" });

    const piApiKey = getPiApiKey();
    if (!piApiKey) return res.status(500).json({ ok: false, error: "Pi API key not configured" });

    logger.info(`[PiPayment] Completing: ${paymentId} txid=${txid}`);

    const response = await fetch(`${PI_API_BASE_URL}/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${piApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ txid })
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error(`[PiPayment] Complete failed: ${response.status} ${errText}`);
      return res.status(500).json({ ok: false, error: `Pi API complete failed: ${response.status}` });
    }

    const now = new Date().toISOString();
    try {
      db.prepare(`UPDATE payments SET status = 'completed', pi_transaction_id = ?, completed_at = ? WHERE local_payment_id = ? OR pi_payment_id = ?`).run(txid, now, paymentId, paymentId);
    } catch (e) { logger.warn(`DB update: ${e.message}`); }

    logger.info(`[PiPayment] Completed ✅: ${paymentId} -> ${txid}`);
    res.json({ ok: true, paymentId, txid, status: "completed" });
  } catch (err) {
    logger.error(`[PiPayment] Complete error: ${err.message}`);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/create-record-day3", (req, res) => {
  try {
    const { uid, username, amount, memo, metadata } = req.body;
    const localPaymentId = uuidv4();
    const now = new Date().toISOString();

    let user = db.prepare("SELECT * FROM users WHERE uid = ?").get(uid);
    if (!user) {
      db.prepare("INSERT INTO users (uid, username, created_at) VALUES (?, ?, ?)").run(uid, username, now);
    }

    db.prepare(`INSERT INTO payments (local_payment_id, uid, username, amount, memo, metadata, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`).run(localPaymentId, uid, username, amount, memo, JSON.stringify(metadata || {}), now);

    logger.info(`[PiPayment] Record created: ${localPaymentId}`);
    res.status(201).json({ ok: true, localPaymentId, status: "pending" });
  } catch (err) {
    logger.error(`[PiPayment] Create error: ${err.message}`);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

module.exports = router;
