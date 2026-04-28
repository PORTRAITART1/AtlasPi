/**
 * AtlasPi Pi Browser Payments Module (OFFICIAL PI SDK)
 * 
 * Uses window.Pi.createPayment() - The official 3-phase payment flow:
 * 1. PHASE I: Server approval
 * 2. PHASE II: Blockchain transaction + user signature
 * 3. PHASE III: Server completion
 * 
 * This requires the user to SIGN the transaction in Pi Wallet/Browser
 */

class PiBrowserPayments {
  constructor() {
    this.sdkAvailable = this.detectPiSdk();
    this.paymentInProgress = false;
    this.lastPaymentAttempt = null;
    this.apiBase = window.API_BASE || 'https://atlaspi-backend.onrender.com';
    
    console.log(`[PiBrowserPayments] Initialized. SDK Available: ${this.sdkAvailable}`);
  }

  /**
   * Detect if Pi SDK is available in window.Pi
   */
  detectPiSdk() {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for Pi SDK - window.Pi.createPayment() is the official API
    if (window.Pi && typeof window.Pi.createPayment === 'function') {
      console.log('[PiBrowserPayments] ✅ Official Pi SDK detected (window.Pi.createPayment)');
      return true;
    }

    console.log('[PiBrowserPayments] ❌ Pi SDK NOT available - running outside Pi Browser');
    return false;
  }

  /**
   * Initiate a payment using the OFFICIAL 3-phase Pi SDK flow
   * 
   * This REQUIRES user to sign the transaction!
   * 
   * @param {Object} paymentConfig - Payment configuration
   * @param {number} paymentConfig.amount - Payment amount in Pi
   * @param {string} paymentConfig.memo - Payment memo/description
   * @returns {Promise<Object>} Payment result { success, paymentId, txid, ... }
   */
  async initiatePayment(paymentConfig) {
    const { amount, memo } = paymentConfig;

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (!this.sdkAvailable) {
      throw new Error('Pi SDK not available - must run on Pi Browser');
    }

    this.paymentInProgress = true;
    this.lastPaymentAttempt = {
      timestamp: new Date().toISOString(),
      config: paymentConfig
    };

    return new Promise((resolve, reject) => {
      try {
        console.log('[PiBrowserPayments] Initiating official 3-phase payment:', paymentConfig);

        // Official Pi SDK - window.Pi.createPayment()
        // This opens the payment dialog and requires user signature
        window.Pi.createPayment(
          {
            amount: parseFloat(amount),
            memo: memo || 'AtlasPi payment'
          },
          {
            /**
             * PHASE I CALLBACK: Server-side approval
             * Pi SDK got the paymentId, asking server to approve
             */
            onReadyForServerApproval: async (paymentId) => {
              try {
                console.log('💳 PHASE I: Server approval - paymentId:', paymentId);

                // Call backend to approve
                const approvalResponse = await fetch(`${this.apiBase}/api/payments/approve`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pi_access_token') || ''}`
                  },
                  body: JSON.stringify({ paymentId })
                });

                if (!approvalResponse.ok) {
                  throw new Error(`Approval failed: ${approvalResponse.status}`);
                }

                const approvalData = await approvalResponse.json();
                console.log('✅ PHASE I complete: Payment approved by server', approvalData);
                
                // Do NOT call resolve here - wait for Phase III
              } catch (error) {
                console.error('❌ PHASE I error:', error);
                this.paymentInProgress = false;
                reject(error);
              }
            },

            /**
             * PHASE II CALLBACK: Blockchain transaction completed
             * User signed the transaction, blockchain confirmed
             * Now server must complete/acknowledge it
             */
            onReadyForServerCompletion: async (paymentId, txid) => {
              try {
                console.log('💳 PHASE II: Blockchain confirmed - txid:', txid);
                console.log('💳 PHASE III: Server completion starting...');

                // Call backend to complete
                const completionResponse = await fetch(`${this.apiBase}/api/payments/complete`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('pi_access_token') || ''}`
                  },
                  body: JSON.stringify({ paymentId, txid })
                });

                if (!completionResponse.ok) {
                  throw new Error(`Completion failed: ${completionResponse.status}`);
                }

                const completionData = await completionResponse.json();
                console.log('✅ PHASE III complete: Payment completed successfully', completionData);

                this.paymentInProgress = false;
                
                // Resolve with full payment info
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Payment completed successfully',
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                console.error('❌ PHASE III error:', error);
                this.paymentInProgress = false;
                reject(error);
              }
            },

            /**
             * Error callback
             */
            onError: (error) => {
              console.error('❌ Payment flow error:', error);
              this.paymentInProgress = false;
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('[PiBrowserPayments] Payment initiation error:', error);
        this.paymentInProgress = false;
        reject(error);
      }
    });
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.sdkAvailable ? 'pi-browser-official' : 'not-available';
  }

  /**
   * Get status object for UI
   */
  getStatus() {
    return {
      sdkAvailable: this.sdkAvailable,
      mode: this.getMode(),
      paymentInProgress: this.paymentInProgress,
      lastAttempt: this.lastPaymentAttempt,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get display message for UI
   */
  getStatusMessage() {
    if (this.sdkAvailable) {
      return '✅ Pi Browser official SDK ready - 3-phase payment flow active';
    } else {
      return '❌ Pi Browser SDK not detected - open this URL in Pi Browser to enable payments';
    }
  }

  /**
   * Check if SDK is available
   */
  isSdkAvailable() {
    return this.sdkAvailable;
  }
}

// Export as global
if (typeof window !== 'undefined') {
  window.PiBrowserPayments = PiBrowserPayments;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PiBrowserPayments;
}
