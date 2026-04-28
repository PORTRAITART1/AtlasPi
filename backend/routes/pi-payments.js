import express from "express";
import axios from "axios";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import envManager from "../config/envManager.js";

const router = express.Router();

// Pi Platform API Client
const piAPIClient = axios.create({
  baseURL: envManager.get('piApiBaseUrl', 'https://api.minepi.com'),
  timeout: 20000,
});

// ============================================================
// 1. APPROVE PAYMENT
// ============================================================
router.post("/approve", (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      logger.error("Approve payment failed: missing paymentId");
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    // Get Pi API Key
    const piApiKey = envManager.get('piApiKey');
    if (!piApiKey) {
      logger.error("Pi API Key not configured");
      return res.status(500).json({
        ok: false,
        error: "Pi integration not configured"
      });
    }

    // Call Pi Platform API to approve
    piAPIClient.post(
      `/v2/payments/${paymentId}/approve`,
      {},
      { headers: { 'Authorization': `Bearer ${piApiKey}` } }
    ).then(() => {
      // Update payment in local DB
      const now = new Date().toISOString();
      db.run(
        `UPDATE payments SET pi_payment_id = ?, status = ?, updated_at = ? WHERE local_payment_id = ?`,
        [paymentId, "approved", now, paymentId],
        function(err) {
          if (err) {
            logger.error("DB update error: " + err.message);
            return res.status(500).json({
              ok: false,
              error: "Database error"
            });
          }
          logger.info(`Payment approved: ${paymentId}`);
          return res.json({
            ok: true,
            status: "approved",
            paymentId
          });
        }
      );
    }).catch((err) => {
      logger.error("Pi API approve error: " + err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to approve payment with Pi API"
      });
    });

  } catch (error) {
    logger.error("Approve payment route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 2. COMPLETE PAYMENT
// ============================================================
router.post("/complete", (req, res) => {
  try {
    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
      logger.error("Complete payment failed: missing fields");
      return res.status(400).json({
        ok: false,
        error: "paymentId and txid are required"
      });
    }

    const piApiKey = envManager.get('piApiKey');
    if (!piApiKey) {
      logger.error("Pi API Key not configured");
      return res.status(500).json({
        ok: false,
        error: "Pi integration not configured"
      });
    }

    // Call Pi Platform API to complete
    piAPIClient.post(
      `/v2/payments/${paymentId}/complete`,
      { txid },
      { headers: { 'Authorization': `Bearer ${piApiKey}` } }
    ).then(() => {
      // Update payment in local DB
      const now = new Date().toISOString();
      db.run(
        `UPDATE payments SET pi_payment_id = ?, txid = ?, status = ?, updated_at = ? WHERE local_payment_id = ?`,
        [paymentId, txid, "completed", now, paymentId],
        function(err) {
          if (err) {
            logger.error("DB update error: " + err.message);
            return res.status(500).json({
              ok: false,
              error: "Database error"
            });
          }
          logger.info(`Payment completed: ${paymentId}, txid: ${txid}`);
          return res.json({
            ok: true,
            status: "completed",
            paymentId,
            txid
          });
        }
      );
    }).catch((err) => {
      logger.error("Pi API complete error: " + err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to complete payment with Pi API"
      });
    });

  } catch (error) {
    logger.error("Complete payment route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 3. HANDLE INCOMPLETE PAYMENT
// ============================================================
router.post("/incomplete", (req, res) => {
  try {
    const { payment } = req.body;

    if (!payment) {
      logger.error("Incomplete payment failed: missing payment");
      return res.status(400).json({
        ok: false,
        error: "payment object is required"
      });
    }

    const paymentId = payment.identifier;
    const txid = payment.transaction && payment.transaction.txid;
    const txURL = payment.transaction && payment.transaction._link;

    if (!paymentId || !txid || !txURL) {
      logger.error("Incomplete payment failed: missing payment details");
      return res.status(400).json({
        ok: false,
        error: "Invalid payment object"
      });
    }

    // Verify transaction on blockchain
    axios.create({ timeout: 20000 }).get(txURL).then((horizonResponse) => {
      const paymentIdOnBlock = horizonResponse.data.memo;

      if (paymentIdOnBlock !== paymentId) {
        logger.error("Payment ID mismatch");
        return res.status(400).json({
          ok: false,
          error: "Payment ID mismatch on blockchain"
        });
      }

      // Update payment in local DB
      const now = new Date().toISOString();
      db.run(
        `UPDATE payments SET pi_payment_id = ?, txid = ?, status = ?, updated_at = ? WHERE local_payment_id = ?`,
        [paymentId, txid, "completed", now, paymentId],
        function(err) {
          if (err) {
            logger.error("DB update error: " + err.message);
            return res.status(500).json({
              ok: false,
              error: "Database error"
            });
          }

          // Notify Pi API
          const piApiKey = envManager.get('piApiKey');
          if (piApiKey) {
            piAPIClient.post(
              `/v2/payments/${paymentId}/complete`,
              { txid },
              { headers: { 'Authorization': `Bearer ${piApiKey}` } }
            ).catch((err) => {
              logger.error("Pi API notification error: " + err.message);
            });
          }

          logger.info(`Incomplete payment handled: ${paymentId}`);
          return res.json({
            ok: true,
            message: "Incomplete payment handled",
            paymentId,
            txid
          });
        }
      );
    }).catch((err) => {
      logger.error("Blockchain verification error: " + err.message);
      return res.status(500).json({
        ok: false,
        error: "Failed to verify transaction on blockchain"
      });
    });

  } catch (error) {
    logger.error("Incomplete payment route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 4. HANDLE CANCELLED PAYMENT
// ============================================================
router.post("/cancelled_payment", (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      logger.error("Cancel payment failed: missing paymentId");
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    const now = new Date().toISOString();
    db.run(
      `UPDATE payments SET status = ?, updated_at = ? WHERE pi_payment_id = ?`,
      ["cancelled", now, paymentId],
      function(err) {
        if (err) {
          logger.error("DB update error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error"
          });
        }
        logger.info(`Payment cancelled: ${paymentId}`);
        return res.json({
          ok: true,
          status: "cancelled",
          paymentId
        });
      }
    );

  } catch (error) {
    logger.error("Cancel payment route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
