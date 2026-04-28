/**
 * Backend: Pi Payment Service
 * Handles official PI Network payment backend integration
 * 
 * File: backend/src/services/pi-payment.ts
 * Usage: import PiPaymentService from './services/pi-payment'
 */

import axios, { AxiosError } from 'axios';

// PI Network API endpoints
const PI_TESTNET_API = 'https://api-testnet.minepi.com';
const PI_MAINNET_API = 'https://api.minepi.com';

// Determine which network to use
const PI_API = process.env.PI_NETWORK === 'testnet' ? PI_TESTNET_API : PI_MAINNET_API;
const SERVER_API_KEY = process.env.PI_SERVER_API_KEY;

if (!SERVER_API_KEY) {
  console.warn('⚠️ PI_SERVER_API_KEY not set. Payment endpoints will fail.');
}

interface PaymentApprovalRequest {
  paymentId: string;
}

interface PaymentCompletionRequest {
  paymentId: string;
  txid: string;
}

interface PiApiResponse {
  status?: string;
  txid?: string;
  error?: string;
}

class PiPaymentService {
  /**
   * PHASE I: Server-Side Approval
   * 
   * Called when:
   * 1. Frontend creates payment
   * 2. Pi SDK obtains paymentId
   * 3. Frontend sends paymentId to backend
   * 4. Backend calls this method
   * 
   * Result:
   * - Pi Server marks payment as approved
   * - User can now sign transaction in wallet
   */
  static async approvePayment(req: PaymentApprovalRequest) {
    if (!SERVER_API_KEY) {
      throw new Error('PI_SERVER_API_KEY not configured');
    }

    try {
      console.log('🔵 [PHASE I] Approving payment:', req.paymentId);

      const response = await axios.post<PiApiResponse>(
        `${PI_API}/v2/payments/${req.paymentId}/approve`,
        {}, // Empty body for approve endpoint
        {
          headers: {
            'Authorization': `Key ${SERVER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [PHASE I] Payment approved successfully:', response.data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ [PHASE I] Payment approval failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      throw error;
    }
  }

  /**
   * PHASE III: Server-Side Completion
   * 
   * Called when:
   * 1. User signs and submits transaction to blockchain
   * 2. Blockchain processes transaction (gets TxID)
   * 3. Pi SDK obtains txid
   * 4. Frontend sends txid to backend
   * 5. Backend calls this method
   * 
   * CRITICAL SECURITY NOTE:
   * ⚠️ Users might be running hacked SDKs and lying about payments
   * ⚠️ ONLY complete payment if Pi Server returns 200 status
   * ⚠️ ALWAYS check blockchain_status before delivering goods/services
   * ⚠️ DO NOT deliver anything if response.status !== 'COMPLETED'
   */
  static async completePayment(req: PaymentCompletionRequest) {
    if (!SERVER_API_KEY) {
      throw new Error('PI_SERVER_API_KEY not configured');
    }

    try {
      console.log('🔵 [PHASE III] Completing payment:', {
        paymentId: req.paymentId,
        txid: req.txid
      });

      const response = await axios.post<PiApiResponse>(
        `${PI_API}/v2/payments/${req.paymentId}/complete`,
        {
          txid: req.txid
        },
        {
          headers: {
            'Authorization': `Key ${SERVER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ [PHASE III] Payment completed:', response.data);

      // CRITICAL VALIDATION
      if (response.status !== 200) {
        throw new Error('Pi Server returned non-200 status for payment completion');
      }

      if (response.data.status !== 'COMPLETED') {
        throw new Error(
          `Payment status is ${response.data.status}, not COMPLETED. ` +
          `Do NOT deliver goods/services until status is COMPLETED`
        );
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('❌ [PHASE III] Payment completion failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      throw error;
    }
  }

  /**
   * Get payment details from Pi Server
   * Useful for verifying payment status later
   */
  static async getPaymentStatus(paymentId: string) {
    if (!SERVER_API_KEY) {
      throw new Error('PI_SERVER_API_KEY not configured');
    }

    try {
      const response = await axios.get<PiApiResponse>(
        `${PI_API}/v2/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Key ${SERVER_API_KEY}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Verify user identity (optional)
   * Called with user's access token
   */
  static async verifyUser(accessToken: string) {
    try {
      const response = await axios.get(
        `${PI_API}/v2/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('User verification failed:', error);
      throw error;
    }
  }

  /**
   * Get network info (testnet vs mainnet)
   */
  static getNetworkInfo() {
    return {
      network: process.env.PI_NETWORK || 'mainnet',
      api: PI_API,
      hasServerKey: !!SERVER_API_KEY
    };
  }
}

export default PiPaymentService;
