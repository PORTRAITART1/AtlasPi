/**
 * AtlasPi Pi Browser Payments Module (MINIMALIST)
 * 
 * This module provides a minimal layer for Pi Browser payment integration.
 * It detects Pi SDK availability and provides honest fallback behavior.
 * 
 * Features:
 * - Detects Pi SDK in window.Pi
 * - Provides fallback demo if SDK unavailable
 * - Honest mode indication (SDK present vs demo mode)
 * - Minimal API surface for payment flow
 */

class PiBrowserPayments {
  constructor() {
    this.sdkAvailable = this.detectPiSdk();
    this.paymentInProgress = false;
    this.lastPaymentAttempt = null;
    
    console.log(`[PiBrowserPayments] Initialized. SDK Available: ${this.sdkAvailable}`);
  }

  /**
   * Detect if Pi SDK is available in window.Pi
   */
  detectPiSdk() {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for Pi SDK presence
    if (window.Pi && typeof window.Pi === 'object') {
      // Check for payment methods
      if (window.Pi.payments && typeof window.Pi.payments.start === 'function') {
        console.log('[PiBrowserPayments] ✅ Real Pi SDK detected with payments API');
        return true;
      }
      
      // Pi object exists but payments not ready
      console.log('[PiBrowserPayments] ⚠️ Pi SDK exists but payments API not available');
      return false;
    }

    console.log('[PiBrowserPayments] ℹ️ No Pi SDK detected - will use demo mode');
    return false;
  }

  /**
   * Initiate a payment using Pi SDK if available, else demo mode
   * 
   * @param {Object} paymentConfig - Payment configuration
   * @param {number} paymentConfig.amount - Payment amount in Pi
   * @param {string} paymentConfig.memo - Payment memo/description
   * @param {string} paymentConfig.localPaymentId - Local payment ID (for tracking)
   * @returns {Promise<Object>} Payment result { ok, paymentId, mode, ... }
   */
  async initiatePayment(paymentConfig) {
    const { amount, memo, localPaymentId } = paymentConfig;

    if (!amount || amount <= 0) {
      return {
        ok: false,
        error: 'Invalid amount',
        mode: this.getMode()
      };
    }

    this.paymentInProgress = true;
    this.lastPaymentAttempt = {
      timestamp: new Date().toISOString(),
      config: paymentConfig,
      mode: this.getMode()
    };

    try {
      if (this.sdkAvailable) {
        return await this._initiatePiPayment(paymentConfig);
      } else {
        return await this._initiateDemoPayment(paymentConfig);
      }
    } catch (error) {
      console.error('[PiBrowserPayments] Payment error:', error);
      return {
        ok: false,
        error: error.message,
        mode: this.getMode()
      };
    } finally {
      this.paymentInProgress = false;
    }
  }

  /**
   * Real Pi SDK payment initiation
   * This is called when window.Pi.payments is available
   */
  async _initiatePiPayment(paymentConfig) {
    console.log('[PiBrowserPayments] 🟢 Initiating REAL Pi payment', paymentConfig);

    try {
      // This is the real Pi SDK call
      // window.Pi.payments.start() is the official Pi Browser payment method
      const paymentId = await window.Pi.payments.start({
        amount: paymentConfig.amount,
        memo: paymentConfig.memo || 'AtlasPi payment',
        metadata: {
          localPaymentId: paymentConfig.localPaymentId,
          source: 'atlaspi-real-sdk'
        }
      });

      console.log('[PiBrowserPayments] ✅ Real Pi payment initiated:', paymentId);

      return {
        ok: true,
        paymentId,
        mode: 'pi-browser-real',
        sdkUsed: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[PiBrowserPayments] Real Pi payment failed:', error.message);

      // If real SDK fails, we don't fallback - we report failure honestly
      return {
        ok: false,
        error: `Pi SDK payment failed: ${error.message}`,
        mode: 'pi-browser-real',
        sdkUsed: true,
        attemptedSdk: true,
        failureReason: 'sdk-error'
      };
    }
  }

  /**
   * Demo payment (when Pi SDK not available)
   */
  async _initiateDemoPayment(paymentConfig) {
    console.log('[PiBrowserPayments] 🟡 Initiating DEMO payment (SDK not available)', paymentConfig);

    // Simulate async delay (realistic demo)
    await new Promise(resolve => setTimeout(resolve, 500));

    const demoPaymentId = `pi-demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('[PiBrowserPayments] ℹ️ Demo payment ID generated:', demoPaymentId);

    return {
      ok: true,
      paymentId: demoPaymentId,
      mode: 'demo',
      sdkUsed: false,
      isDemoPayment: true,
      timestamp: new Date().toISOString(),
      warning: 'This is a DEMO payment - not a real transaction'
    };
  }

  /**
   * Complete a payment (call after user confirms in Pi Browser)
   */
  async completePayment(paymentId) {
    if (!paymentId) {
      return {
        ok: false,
        error: 'Payment ID required'
      };
    }

    try {
      if (this.sdkAvailable) {
        return await this._completePiPayment(paymentId);
      } else {
        return await this._completeDemoPayment(paymentId);
      }
    } catch (error) {
      console.error('[PiBrowserPayments] Complete error:', error);
      return {
        ok: false,
        error: error.message
      };
    }
  }

  /**
   * Complete real Pi payment
   */
  async _completePiPayment(paymentId) {
    console.log('[PiBrowserPayments] Completing real Pi payment:', paymentId);

    try {
      // Call Pi SDK completion
      const txid = await window.Pi.payments.complete({
        paymentId: paymentId
      });

      console.log('[PiBrowserPayments] ✅ Real Pi payment completed. TXID:', txid);

      return {
        ok: true,
        txid,
        mode: 'pi-browser-real',
        sdkUsed: true
      };
    } catch (error) {
      console.error('[PiBrowserPayments] Real Pi completion failed:', error);
      return {
        ok: false,
        error: `Pi completion failed: ${error.message}`,
        sdkUsed: true
      };
    }
  }

  /**
   * Complete demo payment
   */
  async _completeDemoPayment(paymentId) {
    console.log('[PiBrowserPayments] Completing demo payment:', paymentId);

    await new Promise(resolve => setTimeout(resolve, 300));

    const demoTxid = `tx-demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('[PiBrowserPayments] ℹ️ Demo payment completed. Demo TXID:', demoTxid);

    return {
      ok: true,
      txid: demoTxid,
      mode: 'demo',
      isDemoPayment: true,
      warning: 'This is a DEMO transaction ID - not a real blockchain transaction'
    };
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.sdkAvailable ? 'pi-browser-real' : 'demo';
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
      return '✅ Pi Browser payments ready (real SDK detected)';
    } else {
      return '🟡 Pi Browser SDK not available - using DEMO payments for testing';
    }
  }

  /**
   * Check if in demo mode
   */
  isDemoMode() {
    return !this.sdkAvailable;
  }

  /**
   * Check if SDK is truly available
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
