/**
 * Frontend: Pi Payment Service
 * Handles official PI Network payment integration (U2A flow)
 * 
 * File: frontend/src/services/pi-payment.ts
 * Usage: import PiPaymentService from './services/pi-payment'
 */

import axios, { AxiosInstance } from 'axios';

interface PaymentConfig {
  amount: string;
  memo: string;
  metadata?: Record<string, any>;
}

interface PaymentResult {
  success: boolean;
  paymentId: string;
  txid?: string;
  message: string;
}

class PiPaymentService {
  private static apiClient: AxiosInstance;
  private static apiBase = process.env.VITE_API_BASE || 'http://localhost:3001';

  /**
   * Initialize API client with auth token
   */
  static initializeClient() {
    this.apiClient = axios.create({
      baseURL: this.apiBase,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add access token to all requests
    this.apiClient.interceptors.request.use(config => {
      const token = localStorage.getItem('pi_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Create a Pi Payment (U2A - User to App)
   * 
   * Flow:
   * 1. Frontend calls Pi.createPayment()
   * 2. onReadyForServerApproval → backend approves
   * 3. User signs transaction on blockchain
   * 4. onReadyForServerCompletion → backend completes
   * 5. Payment flow closes
   */
  static async createPayment(config: PaymentConfig): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      if (!window.Pi) {
        reject(new Error('Pi SDK not initialized. Call PiSDK.init() first'));
        return;
      }

      if (!this.apiClient) {
        this.initializeClient();
      }

      console.log('Creating Pi payment:', config);

      // Create payment through Pi SDK
      window.Pi.createPayment(
        {
          amount: parseFloat(config.amount),
          memo: config.memo,
          metadata: config.metadata || {}
        },
        {
          /**
           * PHASE I: Server-Side Approval
           * Pi SDK obtained paymentId, waiting for server to approve
           */
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              console.log('💳 PHASE I: Server approval for payment:', paymentId);

              // Send paymentId to backend for approval
              const response = await this.apiClient.post<PaymentResult>(
                '/api/payments/approve',
                { paymentId }
              );

              console.log('✅ Payment approved by server:', response.data);
              // Do NOT call anything here - Pi SDK will continue automatically
            } catch (error) {
              console.error('❌ Payment approval failed:', error);
              reject(error);
            }
          },

          /**
           * PHASE III: Server-Side Completion
           * Blockchain transaction completed, Pi SDK has txid
           * Server must complete the payment
           */
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              console.log('💳 PHASE III: Server completion for payment:', {
                paymentId,
                txid
              });

              // Send txid to backend for completion
              const response = await this.apiClient.post<PaymentResult>(
                '/api/payments/complete',
                { paymentId, txid }
              );

              if (response.status === 200 && response.data.success) {
                console.log('✅ Payment completed successfully:', response.data);
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Payment completed successfully'
                });
              } else {
                throw new Error('Payment completion returned non-200 status');
              }
            } catch (error) {
              console.error('❌ Payment completion failed:', error);
              reject(error);
            }
          },

          /**
           * Error handler
           */
          onError: (error: Error) => {
            console.error('❌ Payment error:', error);
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Get current payment status
   */
  static async getPaymentStatus(paymentId: string) {
    try {
      const response = await this.apiClient.get(`/api/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Get current user's payments
   */
  static async getUserPayments() {
    try {
      const response = await this.apiClient.get('/api/payments/user');
      return response.data;
    } catch (error) {
      console.error('Failed to get user payments:', error);
      throw error;
    }
  }
}

export default PiPaymentService;
