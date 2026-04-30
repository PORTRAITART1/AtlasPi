import express from "express";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * DEMO MODE PAYMENT ENDPOINTS
 * These endpoints handle payments in demo/development mode
 */

// ============================================================
// 1. CREATE PAYMENT RECORD
// ============================================================
router.post("/create-record", (req, res) => {
  try {
    const { amount, memo, metadata } = req.body;

    // Validate required fields
    if (!amount) {
      return res.status(400).json({
        ok: false,
        error: "Amount is required"
      });
    }

    if (!memo) {
      return res.status(400).json({
        ok: false,
        error: "Memo is required"
      });
    }

    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({
        ok: false,
        error: "Metadata object is required"
      });
    }

    // Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Amount must be a positive number"
      });
    }

    // Generate demo payment IDs
    const paymentId = `demo-pi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const localPaymentId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`[Demo Payments] Created payment record: ${paymentId}, Amount: ${numAmount}, Memo: ${memo}`);

    res.status(200).json({
      ok: true,
      paymentId,
      localPaymentId,
      amount: numAmount,
      memo,
      metadata,
      status: "created",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[Demo Payments] Create record error: ${error.message}`);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 2. APPROVE PAYMENT
// ============================================================
router.post("/approve", (req, res) => {
  try {
    const { paymentId, localPaymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    logger.info(`[Demo Payments] Approved payment: ${paymentId}`);

    res.status(200).json({
      ok: true,
      paymentId,
      localPaymentId: localPaymentId || null,
      status: "approved",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[Demo Payments] Approve error: ${error.message}`);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 3. COMPLETE PAYMENT
// ============================================================
router.post("/complete", (req, res) => {
  try {
    const { paymentId, localPaymentId, txid } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    // Generate mock txid if not provided
    const demoTxid = txid || `demo-tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info(`[Demo Payments] Completed payment: ${paymentId}, TxID: ${demoTxid}`);

    res.status(200).json({
      ok: true,
      paymentId,
      localPaymentId: localPaymentId || null,
      txid: demoTxid,
      status: "completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`[Demo Payments] Complete error: ${error.message}`);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 4. LIST PAYMENTS
// ============================================================
router.get("/list", (req, res) => {
  try {
    logger.info(`[Demo Payments] Listing payments (demo mode - no persistence)`);
    res.status(200).json({
      ok: true,
      payments: [],
      total: 0,
      message: "Demo mode - payments are not persisted"
    });
  } catch (error) {
    logger.error(`[Demo Payments] List error: ${error.message}`);
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// ============================================================
// 5. PAYMENT STATUS
// ============================================================
router.get("/status", (req, res) => {
  res.json({
    ok: true,
    message: "Demo payment service ready",
    mode: "demo",
    endpoints: [
      "POST /api/payments/create-record",
      "POST /api/payments/approve",
      "POST /api/payments/complete",
      "GET /api/payments/list",
      "GET /api/payments/status"
    ]
  });
});

// ============================================================
// 6. PROCESS (Legacy endpoint)
// ============================================================
router.post("/process", (req, res) => {
  res.json({
    ok: true,
    message: "Payment processed",
    legacy: true
  });
});

export default router;
