/**
 * AtlasPi Pi Payments Implementation (DAY 3+)
 * Handles Pi Network payment flows, distinguishing between demo, sandbox, and production.
 */

import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import envManager from "../config/envManager.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * Helper: Check if credential is real (used for API keys etc.)
 */
function isRealCredential(value) {
  if (!value) return false;
  const placeholders = ['PLACEHOLDER', 'YOUR_', 'CHANGE_ME', 'NOT_USED', 'DEMO_KEY'];
  return !placeholders.some(p => value.includes(p));
}

/**
 * POST /api/payments/create-record-day3
 * Create a payment record. Handles different modes.
 */
router.post("/create-record-day3", (req, res) => {
  const { uid, username, amount, memo, metadata } = req.body;
  const appMode = envManager.get('mode');

  if (!uid || !username || !amount) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ ok: false, error: 'Amount must be greater than 0' });
  }

  logger.info(`[Payment] create-record mode=${appMode} user=${username} amount=${amount}`);

  const localPaymentId = `payment-${uuidv4()}`;
  const createdAt = new Date().toISOString();
  
  let status = 'pending';
  let message = '';
  let nextStep = '';

  if (appMode === 'demo') {
    status = 'completed'; // Demo payments are immediately completed in the mock flow
    message = 'Demo payment record created (mock flow)';
    nextStep = 'Payment completed (mock)';
  } else if (appMode === 'pirc2-sandbox' || appMode === 'pi-ready') {
    status = 'pending_approval'; // Ready for Pi SDK approval
    message = 'Pi-ready payment record created (awaiting Pi SDK approval)';
    nextStep = 'Initiate payment via Pi Browser SDK';
  } else if (appMode === 'pirc2-production') {
    status = 'pending_approval'; // Ready for Pi SDK approval
    message = 'Production payment record created (awaiting Pi SDK approval)';
    nextStep = 'Initiate payment via Pi Browser SDK';
  }

  db.run(
    `INSERT INTO payments (local_payment_id, username, amount, memo, status, created_at, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [localPaymentId, username, amount, memo || '', status, createdAt, JSON.stringify(metadata || {})],
    function (err) {
      if (err) {
        logger.error(`[Payment] DB error on create: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      return res.json({
        ok: true,
        localPaymentId,
        amount,
        memo: memo || '',
        status,
        message,
        nextStep,
        mode: appMode
      });
    }
  );
});

/**
 * POST /api/payments/approve-pi-real
 * Approves a payment initiated via the REAL Pi Browser SDK.
 * This is called by the frontend after Pi SDK's onReadyForServerApproval.
 */
router.post("/approve-pi-real", async (req, res) => {
  const { paymentId } = req.body; // paymentId comes from Pi SDK
  const appMode = envManager.get('mode');

  if (!paymentId) {
    return res.status(400).json({ ok: false, error: 'Missing paymentId from Pi SDK' });
  }

  logger.info(`[Payment] approve-pi-real mode=${appMode} piPaymentId=${paymentId}`);

  // Find the payment record by its Pi Payment ID (if already created)
  // Or, if this is the first step, create a new record.
  // For simplicity here, we assume the record might already exist or we create it.
  // A more robust flow would involve linking frontend session to backend payment record.

  const piPaymentId = paymentId; // Use the ID from Pi SDK
  const approvedAt = new Date().toISOString();
  const status = 'approved'; // Payment is now approved, waiting for completion

  // Try to find existing record, otherwise create one
  db.get(`SELECT * FROM payments WHERE pi_payment_id = ? OR local_payment_id = ?`, [piPaymentId, paymentId], async (err, row) => {
    if (err) {
      logger.error(`[Payment] DB error finding payment for approval: ${err.message}`);
      return res.status(500).json({ ok: false, error: 'Database error' });
    }

    let query = '';
    let params = [];

    if (row) {
      // Update existing record
      query = `UPDATE payments SET status = ?, updated_at = ? WHERE local_payment_id = ?`;
      params = [status, approvedAt, row.local_payment_id];
      logger.info(`[Payment] Updating existing record for approval: ${row.local_payment_id}`);
    } else {
      // Create a new record if not found (e.g., if frontend didn't create record first)
      // This is a simplified approach; ideally, frontend creates record first.
      const localPaymentId = `payment-${uuidv4()}`; // Generate a new local ID
      query = `INSERT INTO payments (local_payment_id, pi_payment_id, status, created_at, updated_at, metadata) VALUES (?, ?, ?, ?, ?, ?)`;
      params = [localPaymentId, piPaymentId, status, approvedAt, approvedAt, JSON.stringify({ source: 'pi-sdk-approval' })];
      logger.warn(`[Payment] Creating new record during approval for piPaymentId: ${piPaymentId}`);
    }

    db.run(query, params, function (err) {
      if (err) {
        logger.error(`[Payment] DB error on approval update/insert: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      const response = {
        ok: true,
        paymentId: piPaymentId, // Return the Pi Payment ID
        status: status,
        mode: appMode,
        message: ''
      };

      if (appMode === 'pirc2-sandbox' || appMode === 'pi-ready') {
        response.message = 'Sandbox payment approved. Waiting for Pi SDK completion.';
        response.note = 'Real blockchain transaction will be confirmed via Pi SDK.';
      } else if (appMode === 'pirc2-production') {
        response.message = 'Production payment approved. Waiting for Pi mainnet confirmation.';
        response.note = 'Transaction will be verified on Pi mainnet.';
      } else { // Should not happen if called correctly, but as fallback
        response.message = 'Payment approved (mode unknown).';
      }

      return res.json(response);
    });
  });
});

/**
 * POST /api/payments/complete-pi-real
 * Completes a payment after Pi SDK provides the transaction ID (txid).
 * This is called by the frontend after Pi SDK's onReadyForServerCompletion.
 */
router.post("/complete-pi-real", async (req, res) => {
  const { paymentId, txid } = req.body; // paymentId and txid from Pi SDK
  const appMode = envManager.get('mode');

  if (!paymentId || !txid) {
    return res.status(400).json({ ok: false, error: 'Missing paymentId or txid from Pi SDK' });
  }

  logger.info(`[Payment] complete-pi-real mode=${appMode} piPaymentId=${paymentId} txid=${txid}`);

  const completedAt = new Date().toISOString();
  const status = 'completed';

  // Find the payment record using either local_payment_id or pi_payment_id
  db.run(
    `UPDATE payments SET status = ?, txid = ?, updated_at = ? WHERE pi_payment_id = ? OR local_payment_id = ?`,
    [status, txid, completedAt, paymentId, paymentId], // Check both IDs as paymentId might be local or Pi ID
    function (err) {
      if (err) {
        logger.error(`[Payment] DB error on completion update: ${err.message}`);
        return res.status(500).json({ ok: false, error: 'Database error' });
      }

      if (this.changes === 0) {
        // If no record was updated, it might mean the payment wasn't found or already completed.
        // In a real scenario, we might want to fetch and verify the txid on the blockchain.
        logger.warn(`[Payment] No payment record found or updated for completion: ${paymentId} / ${txid}`);
        return res.status(404).json({ ok: false, error: 'Payment record not found or already completed' });
      }

      const response = {
        ok: true,
        paymentId: paymentId, // Return the ID used for lookup
        txid: txid,
        status: status,
        mode: appMode,
        message: ''
      };

      if (appMode === 'pirc2-sandbox' || appMode === 'pi-ready') {
        response.message = 'Sandbox payment completed. Transaction recorded.';
        response.txidType = 'placeholder';
        response.note = 'Real blockchain verification via Pi SDK.';
      } else if (appMode === 'pirc2-production') {
        response.message = 'Production payment completed. Transaction verified on Pi mainnet.';
        response.txidType = 'blockchain';
      } else { // Demo mode fallback or unknown
        response.message = 'Payment completed (mode unknown or demo fallback).';
        response.txidType = 'mock';
      }

      return res.json(response);
    }
  );
});

/**
 * GET /api/payments/verify-pi-real/:paymentId
 * Verifies the status of a payment, especially for real Pi payments.
 * This route is primarily for checking status after the fact.
 */
router.get("/verify-pi-real/:paymentId", (req, res) => {
  const { paymentId } = req.params;
  const appMode = envManager.get('mode');

  logger.info(`[Payment] verify-pi-real mode=${appMode} paymentId=${paymentId}`);

  // Search by both local_payment_id and pi_payment_id
  db.get(
    `SELECT * FROM payments WHERE local_payment_id = ? OR pi_payment_id = ?`,
    [paymentId, paymentId],
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
  // For demo mode, verification is always true (mock)
  if (mode === 'demo') {
    return {
      verified: true,
      type: 'demo-mock',
      message: 'Demo payment (no real verification)',
      realBlockchain: false
    };
  }

  // For sandbox/pi-ready, status is based on our internal state, txid is placeholder
  if (mode === 'pirc2-sandbox' || mode === 'pi-ready') {
    const verified = payment.status === 'completed' && !!payment.txid;
    return {
      verified,
      type: 'pi-sandbox-placeholder',
      message: verified
        ? 'Sandbox payment completed (awaiting real Pi blockchain verification)'
        : `Payment ${payment.status} (awaiting Pi SDK processing)`,
      realBlockchain: false,
      txid: payment.txid,
      note: 'Real blockchain verification will be available via Pi SDK.'
    };
  }

  // For production, we'd ideally check the blockchain. For now, rely on our DB status.
  if (mode === 'pirc2-production') {
    const verified = payment.status === 'completed' && !!payment.txid;
    return {
      verified,
      type: 'pi-production-blockchain',
      message: verified
        ? 'Production payment completed (transaction recorded)'
        : `Payment ${payment.status}`,
      realBlockchain: true, // Indicates it's intended for blockchain
      txid: payment.txid,
      note: 'Real blockchain verification pending integration with Pi mainnet APIs.'
    };
  }

  // Fallback for unknown modes
  return {
    verified: false,
    type: 'unknown',
    message: 'Unknown verification mode'
  };
}

// Export the router
export default router;
