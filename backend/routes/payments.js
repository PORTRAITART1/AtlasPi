import express from "express";

const router = express.Router();

// Demo/payment fallback endpoints used by the existing demo flow
router.get("/status", (req, res) => {
  res.json({ ok: true, message: "Payment service ready" });
});

router.post("/process", (req, res) => {
  res.json({ ok: true, message: "Payment processed" });
});

// Create payment record (demo mode)
router.post("/create-record", (req, res) => {
  try {
    const { amount, memo, metadata } = req.body;

    // Validate required fields
    if (!amount || !memo || !metadata) {
      return res.status(400).json({
        ok: false,
        error: "Amount, memo, and metadata must be provided."
      });
    }

    // Generate a mock payment ID
    const paymentId = `demo-payment-${Date.now()}`;
    const localPaymentId = `local-${Date.now()}`;

    console.log(`[Payments] Created demo payment record: ${paymentId}`);

    res.json({
      ok: true,
      paymentId,
      localPaymentId,
      amount,
      memo,
      status: "demo_created",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Approve payment (demo mode)
router.post("/approve", (req, res) => {
  try {
    const { paymentId, localPaymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    console.log(`[Payments] Approved demo payment: ${paymentId}`);

    res.json({
      ok: true,
      paymentId,
      status: "demo_approved",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// Complete payment (demo mode)
router.post("/complete", (req, res) => {
  try {
    const { paymentId, txid, localPaymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        error: "paymentId is required"
      });
    }

    console.log(`[Payments] Completed demo payment: ${paymentId}, txid: ${txid}`);

    res.json({
      ok: true,
      paymentId,
      txid: txid || `demo-tx-${Date.now()}`,
      status: "demo_completed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// List payments (demo mode)
router.get("/list", (req, res) => {
  res.json({
    ok: true,
    payments: [],
    message: "No payments in demo mode yet"
  });
});

export default router;
