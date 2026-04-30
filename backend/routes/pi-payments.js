import express from "express";
import axios from "axios";
import logger from "../utils/logger.js";
import envManager from "../config/envManager.js";

const router = express.Router();

/**
 * REAL PI NETWORK PAYMENT ENDPOINTS
 * These endpoints handle real Pi Network payments (sandbox/production mode)
 */

// Helper function to get Pi API client with current config
const getPiAPIClient = () => {
  const baseURL = envManager.get('piApiBaseUrl', 'https://api.minepi.com');
  logger.info(`[Pi Payments] Using Pi API base URL: ${baseURL}`);
  return axios.create({
    baseURL,
    timeout: 20000,
  });
};

// ============================================================
// 1. APPROVE PAYMENT (Real Pi Network)
// ============================================================
router.post("/approve", (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      logger.error("[Pi Payments] Approve failed: missing paymentId");
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    // Get Pi API Key
    const piApiKey = envManager.get('piApiKey');
    if (!piApiKey || piApiKey === 'PLACEHOLDER') {
      logger.error("[Pi Payments] Pi API Key not configured or placeholder");
      return res.status(500).json({
        ok: false,
        error: "Pi API Key not configured"
      });
    }

    const piAPIClient = getPiAPIClient();

    logger.info(`[Pi Payments] Approving payment ${paymentId} with key: ${piApiKey.substring(0, 10)}...`);

    // Call Pi Platform API to approve
    piAPIClient.post(
      `/v2/payments/${paymentId}/approve`,
      {},
      { headers: { 'Authorization': `Bearer ${piApiKey}` } }
    )
      .then((response) => {
        logger.info(`[Pi Payments] Payment approved: ${paymentId}`);
        return res.json({
          ok: true,
          paymentId,
          status: "approved",
          timestamp: new Date().toISOString()
        });
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.message;
        const errorStatus = err.response?.status || err.status;
        logger.error(`[Pi Payments] Pi API approve error: ${errorStatus} - ${errorMsg}`);
        return res.status(500).json({
          ok: false,
          error: `Failed to approve payment with Pi API: ${errorStatus} ${errorMsg}`,
          details: errorMsg
        });
      });

  } catch (error) {
    logger.error(`[Pi Payments] Approve route error: ${error.message}`);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 2. COMPLETE PAYMENT (Real Pi Network)
// ============================================================
router.post("/complete", (req, res) => {
  try {
    const { paymentId, txid } = req.body;

    if (!paymentId) {
      logger.error("[Pi Payments] Complete failed: missing paymentId");
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    if (!txid) {
      logger.error("[Pi Payments] Complete failed: missing txid");
      return res.status(400).json({
        ok: false,
        error: "txid is required"
      });
    }

    const piApiKey = envManager.get('piApiKey');
    if (!piApiKey || piApiKey === 'PLACEHOLDER') {
      logger.error("[Pi Payments] Pi API Key not configured or placeholder");
      return res.status(500).json({
        ok: false,
        error: "Pi API Key not configured"
      });
    }

    const piAPIClient = getPiAPIClient();

    logger.info(`[Pi Payments] Completing payment ${paymentId} with txid ${txid}`);

    // Call Pi Platform API to complete
    piAPIClient.post(
      `/v2/payments/${paymentId}/complete`,
      { txid },
      { headers: { 'Authorization': `Bearer ${piApiKey}` } }
    )
      .then((response) => {
        logger.info(`[Pi Payments] Payment completed: ${paymentId}, txid: ${txid}`);
        return res.json({
          ok: true,
          paymentId,
          txid,
          status: "completed",
          timestamp: new Date().toISOString()
        });
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.message;
        const errorStatus = err.response?.status || err.status;
        logger.error(`[Pi Payments] Pi API complete error: ${errorStatus} - ${errorMsg}`);
        return res.status(500).json({
          ok: false,
          error: `Failed to complete payment with Pi API: ${errorStatus} ${errorMsg}`,
          details: errorMsg
        });
      });

  } catch (error) {
    logger.error(`[Pi Payments] Complete route error: ${error.message}`);
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
      logger.error("[Pi Payments] Incomplete failed: missing payment");
      return res.status(400).json({
        ok: false,
        error: "payment object is required"
      });
    }

    const paymentId = payment.identifier;
    const txid = payment.transaction && payment.transaction.txid;
    const txURL = payment.transaction && payment.transaction._link;

    if (!paymentId || !txid || !txURL) {
      logger.error("[Pi Payments] Incomplete failed: invalid payment details");
      return res.status(400).json({
        ok: false,
        error: "Invalid payment object - missing identifier, txid, or transaction link"
      });
    }

    // Verify transaction on blockchain
    axios.create({ timeout: 20000 })
      .get(txURL)
      .then((horizonResponse) => {
        const paymentIdOnBlock = horizonResponse.data.memo;

        if (paymentIdOnBlock !== paymentId) {
          logger.error("[Pi Payments] Payment ID mismatch on blockchain");
          return res.status(400).json({
            ok: false,
            error: "Payment ID mismatch on blockchain"
          });
        }

        // Notify Pi API about completion
        const piApiKey = envManager.get('piApiKey');
        if (piApiKey && piApiKey !== 'PLACEHOLDER') {
          const piAPIClient = getPiAPIClient();
          piAPIClient.post(
            `/v2/payments/${paymentId}/complete`,
            { txid },
            { headers: { 'Authorization': `Bearer ${piApiKey}` } }
          )
            .then(() => {
              logger.info(`[Pi Payments] Incomplete payment handled: ${paymentId}`);
              return res.json({
                ok: true,
                paymentId,
                txid,
                status: "completed",
                message: "Incomplete payment verified and completed",
                timestamp: new Date().toISOString()
              });
            })
            .catch((err) => {
              logger.error(`[Pi Payments] Pi API notification error: ${err.message}`);
              return res.json({
                ok: true,
                paymentId,
                txid,
                status: "verified",
                message: "Payment verified on blockchain but Pi API notification failed",
                timestamp: new Date().toISOString()
              });
            });
        } else {
          logger.warn("[Pi Payments] No valid Pi API Key configured, skipping Pi API notification");
          return res.json({
            ok: true,
            paymentId,
            txid,
            status: "verified",
            message: "Payment verified on blockchain (Pi API key not configured)",
            timestamp: new Date().toISOString()
          });
        }
      })
      .catch((err) => {
        logger.error(`[Pi Payments] Blockchain verification error: ${err.message}`);
        return res.status(500).json({
          ok: false,
          error: "Failed to verify transaction on blockchain",
          details: err.message
        });
      });

  } catch (error) {
    logger.error(`[Pi Payments] Incomplete route error: ${error.message}`);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 4. HANDLE CANCELLED PAYMENT
// ============================================================
router.post("/cancelled", (req, res) => {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      logger.error("[Pi Payments] Cancel failed: missing paymentId");
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    logger.info(`[Pi Payments] Payment cancelled: ${paymentId}`);
    res.status(200).json({
      ok: true,
      paymentId,
      status: "cancelled",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`[Pi Payments] Cancel route error: ${error.message}`);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 5. PI PAYMENTS STATUS
// ============================================================
router.get("/status", (req, res) => {
  const piApiKey = envManager.get('piApiKey');
  const piApiBase = envManager.get('piApiBaseUrl');
  const isConfigured = piApiKey && piApiKey !== 'PLACEHOLDER';
  
  res.json({
    ok: true,
    message: "Real Pi Network payment service",
    mode: "pi-network",
    configured: isConfigured,
    piApiBaseUrl: piApiBase,
    endpoints: [
      "POST /api/pi-payments/approve",
      "POST /api/pi-payments/complete",
      "POST /api/pi-payments/incomplete",
      "POST /api/pi-payments/cancelled",
      "GET /api/pi-payments/status"
    ]
  });
});

export default router;
