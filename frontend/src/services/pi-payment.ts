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
  paymentId?: string; // Can be null if payment fails before server approval
  txid?: string;
  message: string;
  mode?: string; // To indicate the mode used (real, demo)
}

class PiPaymentService {
  private static apiClient: AxiosInstance;
  // Use the global configuration for API Base URL
  private static apiBase = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000'; // Fallback

  /**
   * Initializes the API client with authentication token.
   */
  static initializeClient() {
    this.apiClient = axios.create({
      baseURL: this.apiBase,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add the access token to all requests
    this.apiClient.interceptors.request.use(config => {
      // NOTE: The access token for real Pi payments might be handled differently,
      // potentially by the Pi SDK itself or via specific backend authentication.
      // For now, we assume it might be stored locally.
      const token = localStorage.getItem('pi_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Creates a Pi payment (U2A - User to App).
   * 
   * Flow:
   * 1. Frontend calls Pi.createPayment()
   * 2. onReadyForServerApproval → backend approves (dedicated route)
   * 3. User signs the transaction on the blockchain
   * 4. onReadyForServerCompletion → backend completes (dedicated route)
   * 5. The payment flow closes
   */
  static async createPayment(config: PaymentConfig): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      // Check if the Pi SDK is available
      if (!window.Pi || typeof window.Pi.createPayment !== 'function') {
        console.warn('[PiPaymentService] Pi SDK not available. Falling back to DEMO payment.');
        // Call the global demo payment handler
        if (window.triggerDemoPaymentFlow) {
          window.triggerDemoPaymentFlow(config, resolve, reject);
        } else {
          reject(new Error('Pi SDK not available and no demo payment handler found.'));
        }
        return;
      }

      // Initialize the API client if it hasn't been already
      if (!this.apiClient) {
        this.initializeClient();
      }

      console.log('Creating Pi payment via SDK:', config);

      // Create the payment via Pi SDK
      window.Pi.createPayment(
        {
          amount: parseFloat(config.amount),
          memo: config.memo,
          metadata: config.metadata || {}
        },
        {
          /**
           * PHASE I: Server Approval
           * Pi SDK has obtained the paymentId, waiting for server approval.
           */
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              console.log('💳 PHASE I: Server approval for payment:', paymentId);

              // Send paymentId to backend for approval (dedicated route for real Pi)
              const response = await this.apiClient.post<PaymentResult>(
                '/api/payments/approve-pi-real', // New backend route
                { paymentId }
              );

              if (response.status === 200 && response.data.success) {
                console.log('✅ Payment approved by server:', response.data);
                // Do nothing here, Pi SDK continues automatically
              } else {
                // Throw an error with details from the backend response
                throw new Error(response.data.message || `Payment approval failed with status ${response.status}`);
              }
            } catch (error: any) {
              console.error('❌ Payment approval failed:', error.message);
              reject(new Error(`Payment approval failed: ${error.message}`));
            }
          },

          /**
           * PHASE III: Server Completion
           * Blockchain transaction confirmed, Pi SDK has the txid.
           * The server must complete the payment.
           */
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              console.log('💳 PHASE III: Server completion for payment:', {
                paymentId,
                txid
              });

              // Send txid to backend for completion (dedicated route for real Pi)
              const response = await this.apiClient.post<PaymentResult>(
                '/api/payments/complete-pi-real', // New backend route
                { paymentId, txid }
              );

              if (response.status === 200 && response.data.success) {
                console.log('✅ Payment completed successfully:', response.data);
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Payment completed successfully via Pi Browser SDK',
                  mode: 'real' // Indicate it was a real payment
                });
              } else {
                // Throw an error with details from the backend response
                throw new Error(response.data.message || `Payment completion failed with status ${response.status}`);
              }
            } catch (error: any) {
              console.error('❌ Payment completion failed:', error.message);
              reject(new Error(`Payment completion failed: ${error.message}`));
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

  // ... (getPaymentStatus, getUserPayments - not modified for now)
}

// Expose globally for use by script.js
if (typeof window !== 'undefined') {
  window.PiPaymentService = PiPaymentService;
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PiPaymentService;
}
