/**
 * Backend: Pi Payment Routes
 * Express routes for payment approval and completion
 * 
 * File: backend/src/routes/payments.ts
 * Usage: app.use('/api', paymentsRouter)
 */

import express, { Request, Response } from 'express';
import PiPaymentService from '../services/pi-payment';

const router = express.Router();

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

    // ✅ NOW you can safely deliver goods/services
    // Example: await User.findByIdAndUpdate(userId, { isPremium: true });

    res.json({
      success: true,
      paymentId,
      txid,
      message: 'Payment completed successfully'
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
 * GET /api/payments/network/info
 * 
 * Get current network info (testnet vs mainnet)
 * Useful for debugging
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

export default router;
