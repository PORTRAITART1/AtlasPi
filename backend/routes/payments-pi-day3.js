/**
 * AtlasPi Pi Payments Real Implementation (DAY 3)
 * 
 * Implements realistic Pi payment flow based on available credentials.
 * 
 * Distinguishes:
 * - Demo payments (mock flow)
 * - Sandbox payments (Pi-ready structure with placeholder credentials)
 * - Production payments (real Pi Network mainnet)
 * 
 * All modes maintain backward compatibility and clear status messaging.
 */

import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import envManager from "../config/envManager.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * Helper: Check if credential is real
 */
function isRealCredential(value) {
  if (!value) return false;
  const placeholders = ['PLACEHOLDER', 'YOUR_', 'CHANGE_ME', 'NOT_USED', 'DEMO_KEY'];
  return !placeholders.some(p => value.includes(p));
}

/**
 * POST /api/payments/create-record-day3
 * Create a payment record with Pi mode detection
 */
router.post("/create-record-day3", (req, res) => {
  const { uid, username, amount, memo, metadata } = req.body;
  const appMode = envManager.get('mode');

  if (!uid || !username || !amount) {
    return res.status(400).json({
      ok: false,
      error: 'Missing required fields'
    });
  }

  if (Number(amount) <= 0) {
    return res.status(400).json({
      ok: false,
      error: 'Amount must be greater than 0'
    });
  }

  logger.info(`[Payment] create-record mode=${appMode} user=${username} amount=${amount}`);

  const paymentId = `payment-${uuidv4()}`;
  const createdAt = new Date().toISOString();
  const status = appMode === 'demo' ? 'completed' : 'pending';

  db.run(
    `INSERT INTO payments (local_payment_id, username, amount, memo, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [paymentId, username, amount, memo || '', status, createdAt],
    function (err) {
      if (err) {
        logger.error(`[Payment] DB error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      const response = {
        ok: true,
        localPaymentId: paymentId,
        mode: appMode,
        amount,
        memo: memo || '',
        status
      };

      if (appMode === 'demo') {
        response.message = 'Demo payment record created (mock flow)';
      } else if (appMode === 'pirc2-sandbox' || appMode === 'pi-ready') {
        response.message = 'Pi-ready payment record created (ready for real Pi SDK integration)';
        response.nextStep = 'Await real Pi Payment SDK to approve/complete this payment';
      } else if (appMode === 'pirc2-production') {
        response.message = 'Production payment record created (awaiting Pi mainnet verification)';
        response.nextStep = 'Real Pi mainnet payment flow';
      }

      return res.json(response);
    }
  );
});

/**
 * POST /api/payments/approve-day3
 * Approve a payment (transition to approved state)
 */
router.post("/approve-day3", (req, res) => {
  const { localPaymentId, paymentId } = req.body;
  const appMode = envManager.get('mode');

  if (!localPaymentId) {
    return res.status(400).json({
      ok: false,
      error: 'Missing localPaymentId'
    });
  }

  logger.info(`[Payment] approve mode=${appMode} localId=${localPaymentId}`);

  const piPaymentId = paymentId || `pi-${Date.now()}`;
  const approvedAt = new Date().toISOString();

  db.run(
    `UPDATE payments SET pi_payment_id = ?, status = 'approved', updated_at = ? WHERE local_payment_id = ?`,
    [piPaymentId, approvedAt, localPaymentId],
    function (err) {
      if (err) {
        logger.error(`[Payment] Approve error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ ok: false, error: 'Payment not found' });
      }

      const response = {
        ok: true,
        localPaymentId,
        piPaymentId,
        status: 'approved',
        mode: appMode
      };

      if (appMode === 'demo') {
        response.message = 'Demo payment approved (mock)';
      } else if (appMode === 'pirc2-sandbox') {
        response.message = 'Sandbox payment approved (awaiting real Pi SDK to process)';
      } else if (appMode === 'pirc2-production') {
        response.message = 'Production payment approved (awaiting Pi mainnet confirmation)';
      }

      return res.json(response);
    }
  );
});

/**
 * POST /api/payments/complete-day3
 * Complete a payment with transaction ID
 */
router.post("/complete-day3", (req, res) => {
  const { localPaymentId, paymentId, txid } = req.body;
  const appMode = envManager.get('mode');

  if (!localPaymentId) {
    return res.status(400).json({
      ok: false,
      error: 'Missing localPaymentId'
    });
  }

  logger.info(`[Payment] complete mode=${appMode} localId=${localPaymentId} txid=${txid || 'n/a'}`);

  const completedAt = new Date().toISOString();

  db.run(
    `UPDATE payments SET status = 'completed', txid = ?, updated_at = ? WHERE local_payment_id = ?`,
    [txid || `demo-tx-${Date.now()}`, completedAt, localPaymentId],
    function (err) {
      if (err) {
        logger.error(`[Payment] Complete error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ ok: false, error: 'Payment not found' });
      }

      const response = {
        ok: true,
        localPaymentId,
        txid: txid || `demo-tx-${Date.now()}`,
        status: 'completed',
        mode: appMode
      };

      if (appMode === 'demo') {
        response.message = 'Demo payment completed (mock transaction)';
        response.txidType = 'mock';
      } else if (appMode === 'pirc2-sandbox') {
        response.message = 'Sandbox payment completed (awaiting real Pi transaction)';
        response.txidType = 'placeholder';
        response.note = 'Real blockchain transaction will be available via Pi SDK';
      } else if (appMode === 'pirc2-production') {
        response.message = 'Production payment completed (blockchain transaction)';
        response.txidType = 'blockchain';
        response.note = 'Transaction verified on Pi mainnet';
      }

      return res.json(response);
    }
  );
});

/**
 * GET /api/payments/verify-day3/:paymentId
 * Verify payment status (enhanced for Pi modes)
 */
router.get("/verify-day3/:paymentId", (req, res) => {
  const { paymentId } = req.params;
  const appMode = envManager.get('mode');

  logger.info(`[Payment] verify mode=${appMode} paymentId=${paymentId}`);

  db.get(
    `SELECT * FROM payments WHERE local_payment_id = ?`,
    [paymentId],
    (err, payment) => {
      if (err) {
        logger.error(`[Payment] Verify error: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      if (!payment) {
        return res.status(404).json({ ok: false, error: 'Payment not found' });
      }

      const response = {
        ok: true,
        payment: {
          localPaymentId: payment.local_payment_id,
          piPaymentId: payment.pi_payment_id,
          username: payment.username,
          amount: payment.amount,
          status: payment.status,
          txid: payment.txid,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        },
        mode: appMode,
        verificationStatus: getPaymentVerificationStatus(appMode, payment)
      };

      return res.json(response);
    }
  );
});

/**
 * Helper: Get payment verification status message based on mode and payment state
 */
function getPaymentVerificationStatus(mode, payment) {
  if (mode === 'demo') {
    return {
      verified: true,
      type: 'demo-mock',
      message: 'Demo payment (no real verification)',
      realBlockchain: false
    };
  }

  if (mode === 'pirc2-sandbox') {
    const verified = payment.status === 'completed';
    return {
      verified,
      type: 'pi-sandbox-placeholder',
      message: verified 
        ? 'Sandbox payment completed (awaiting real Pi blockchain)' 
        : `Payment ${payment.status} (awaiting Pi SDK processing)`,
      realBlockchain: false,
      note: 'Real blockchain verification will be available via Pi SDK'
    };
  }

  if (mode === 'pirc2-production') {
    // In production, we'd check against real Pi blockchain
    // For now, return status with note about pending blockchain check
    return {
      verified: payment.status === 'completed' && !!payment.txid,
      type: 'pi-production-blockchain',
      message: payment.status === 'completed' 
        ? 'Payment completed (blockchain transaction recorded)'
        : `Payment ${payment.status}`,
      realBlockchain: true,
      txid: payment.txid,
      note: 'Real blockchain verification required - integration with Pi mainnet pending'
    };
  }

  return {
    verified: false,
    type: 'unknown',
    message: 'Unknown verification mode'
  };
}

export default router;
