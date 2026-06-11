/**
 * Backend: Pi Payment Routes
 * Express routes for payment approval and completion
 * 
 * File: backend/src/routes/payments.ts
 * Usage: app.use('/api', paymentsRouter)
 */

import express, { Request, Response } from 'express';
import PiPaymentService from '../services/pi-payment';
import db from '../../config/db.js';

const router = express.Router();

// Helper: activate VIP for user after confirmed payment
function activateVIP(uid: string, username: string, paymentId: string, txid: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const vipExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    db.run(
      `INSERT INTO users (uid, username, is_vip, vip_expires_at, vip_payment_id, vip_txid, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?)
       ON CONFLICT(uid) DO UPDATE SET
         is_vip = 1,
         vip_expires_at = ?,
         vip_payment_id = ?,
         vip_txid = ?,
         updated_at = ?`,
      [uid, username, vipExpiry, paymentId, txid, now, now,
       vipExpiry, paymentId, txid, now],
      (err: any) => {
        if (err) {
          console.error('❌ VIP activation failed:', err.message);
          reject(err);
        } else {
          console.log(`✅ VIP activated for user ${username} (${uid}) until ${vipExpiry}`);
          resolve();
        }
      }
    );
  });
}

/**
 * POST /api/payments/approve
 * 
 * Called by frontend during PHASE I
 * 
 * Request body:
 * {
 *   "paymentId": "payment_xxx"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "paymentId": "payment_xxx",
 *   "message": "Payment approved by server"
 * }
 */
router.post('/payments/approve', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.body;

    // Validate request
    if (!paymentId) {
      console.warn('❌ Missing paymentId in approval request');
      return res.status(400).json({
        error: 'paymentId is required',
        success: false
      });
    }

    console.log('🔵 Received payment approval request:', paymentId);

    // Call Pi Platform approval API
    const result = await PiPaymentService.approvePayment({ paymentId });

    console.log('✅ Payment approved:', result);

    res.json({
      success: true,
      paymentId,
      message: 'Payment approved by server'
    });
  } catch (error: any) {
    console.error('❌ Payment approval error:', error.message);

    // Return appropriate error status
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message;

    res.status(statusCode).json({
      error: 'Payment approval failed',
      details: errorMessage,
      success: false
    });
  }
});

/**
 * POST /api/payments/complete
 * 
 * Called by frontend during PHASE III
 * 
 * ⚠️ CRITICAL SECURITY:
 * - ONLY mark payment complete if response status is 200
 * - ALWAYS check response.data.status === 'COMPLETED'
 * - NEVER deliver goods/services if status is not COMPLETED
 * - Users might have hacked SDKs and lie about payments
 * 
 * Request body:
 * {
 *   "paymentId": "payment_xxx",
 *   "txid": "0x..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "paymentId": "payment_xxx",
 *   "txid": "0x...",
 *   "message": "Payment completed successfully"
 * }
 */
router.post('/payments/complete', async (req: Request, res: Response) => {
  try {
    const { paymentId, txid } = req.body;

    // Validate request
    if (!paymentId || !txid) {
      console.warn('❌ Missing paymentId or txid in completion request');
      return res.status(400).json({
        error: 'paymentId and txid are required',
        success: false
      });
    }

    console.log('🔵 Received payment completion request:', { paymentId, txid });

    // Call Pi Platform completion API
    const result = await PiPaymentService.completePayment({ paymentId, txid });

    console.log('✅ Payment completed:', result);

    // CRITICAL: Validate before delivering goods/services
    if (result.status !== 'COMPLETED') {
      console.error('❌ Payment status is not COMPLETED:', result.status);
      return res.status(400).json({
        error: `Payment status is ${result.status}, not COMPLETED`,
        success: false,
        message: 'DO NOT DELIVER GOODS/SERVICES'
      });
    }

    // ✅ Activate VIP for user
    const { uid, username } = req.body;
    if (uid) {
      try {
        await activateVIP(uid, username || 'unknown', paymentId, txid);
        console.log('✅ VIP activated for:', uid);
      } catch (vipErr: any) {
        console.error('⚠️ VIP activation error (payment still valid):', vipErr.message);
      }
    }

    res.json({
      success: true,
      paymentId,
      txid,
      vipActivated: !!uid,
      message: 'Payment completed successfully — VIP activated'
    });
  } catch (error: any) {
    console.error('❌ Payment completion error:', error.message);

    // Return appropriate error status
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message;

    res.status(statusCode).json({
      error: 'Payment completion failed',
      details: errorMessage,
      success: false,
      message: 'DO NOT DELIVER GOODS/SERVICES - Payment verification failed'
    });
  }
});

/**
 * GET /api/payments/network/info
 * ⚠️ Must be BEFORE /payments/:paymentId to avoid being captured
 * Get current network info (mainnet vs testnet)
 */
router.get('/payments/network/info', (req: Request, res: Response) => {
  const info = PiPaymentService.getNetworkInfo();

  res.json({
    success: true,
    network: info.network,
    api: info.api,
    hasServerKey: info.hasServerKey
  });
});

/**
 * GET /api/payments/:paymentId
 * 
 * Get payment status from Pi Platform
 * Useful for checking payment status later
 */
router.get('/payments/:paymentId', async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;

    const status = await PiPaymentService.getPaymentStatus(paymentId);

    res.json({
      success: true,
      paymentId,
      status
    });
  } catch (error: any) {
    console.error('❌ Failed to get payment status:', error.message);

    res.status(500).json({
      error: 'Failed to get payment status',
      details: error.message,
      success: false
    });
  }
});

/**
 * GET /api/user/status
 * Get VIP status for a user by uid
 */
router.get('/user/status', async (req: Request, res: Response) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ error: 'uid is required', success: false });
  }

  db.get(
    `SELECT uid, username, is_vip, vip_expires_at, vip_payment_id FROM users WHERE uid = ?`,
    [uid],
    (err: any, row: any) => {
      if (err) {
        return res.status(500).json({ error: 'DB error', success: false });
      }

      if (!row) {
        return res.json({
          success: true,
          uid,
          isVIP: false,
          vipExpiry: null,
          message: 'User not found — not VIP'
        });
      }

      const now = new Date();
      const expiry = row.vip_expires_at ? new Date(row.vip_expires_at) : null;
      const isVIPActive = row.is_vip === 1 && expiry && expiry > now;

      res.json({
        success: true,
        uid: row.uid,
        username: row.username,
        isVIP: isVIPActive,
        vipExpiry: row.vip_expires_at,
        message: isVIPActive ? '✅ VIP active' : '❌ VIP not active'
      });
    }
  );
});

export default router;
