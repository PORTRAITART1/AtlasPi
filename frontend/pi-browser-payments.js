/**
 * PiBrowserPayments - Handles Pi Browser payment initiation
 * Supports both real Pi SDK and demo fallback modes
 */

class PiBrowserPayments {
  constructor() {
    this.sdkAvailable = this.detectPiSdk();
    this.paymentInProgress = false;
    this.lastPaymentAttempt = null;
    this.apiBase = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000';

    console.log(`[PiBrowserPayments] Initialized. SDK Available: ${this.sdkAvailable}, API Base: ${this.apiBase}`);
  }

  detectPiSdk() {
    if (typeof window === 'undefined') {
      return false;
    }
    if (window.Pi && typeof window.Pi.createPayment === 'function') {
      console.log('[PiBrowserPayments] ✅ Official Pi SDK detected');
      return true;
    }
    console.log('[PiBrowserPayments] ❌ Pi SDK NOT available');
    return false;
  }

  isSdkReady() {
    return this.detectPiSdk();
  }

  refreshSdkStatus() {
    this.sdkAvailable = this.isSdkReady();
    console.log(`[PiBrowserPayments] SDK status refreshed: ${this.sdkAvailable}`);
  }

  /**
   * Initiate payment - routes to real or demo based on SDK availability
   */
  async initiatePayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const currentMode = window.piIntegrationManager?.getMode() || 'demo';
    const isPiSdkAvailable = this.isSdkReady();

    console.log(`[PiBrowserPayments] Initiating payment. Mode: ${currentMode}, SDK: ${isPiSdkAvailable}`);

    this.paymentInProgress = true;
    this.lastPaymentAttempt = {
      timestamp: new Date().toISOString(),
      config: paymentConfig,
      mode: currentMode,
      sdkAvailable: isPiSdkAvailable
    };

    try {
      // Use real Pi SDK if available and not in demo mode
      if (isPiSdkAvailable && currentMode !== 'demo') {
        console.log('[PiBrowserPayments] Using REAL Pi Browser payment');
        return await this.initiateRealPiPayment(paymentConfig);
      } else {
        console.log('[PiBrowserPayments] Using DEMO payment mode');
        return await this.initiateDemoPayment(paymentConfig);
      }
    } finally {
      this.paymentInProgress = false;
    }
  }

  /**
   * Demo payment flow - calls backend demo endpoints
   */
  async initiateDemoPayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    try {
      // Step 1: Create payment record
      console.log('[Demo Payment] Creating payment record...');
      const createResponse = await fetch(`${this.apiBase}/api/payments/create-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, memo, metadata })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create payment: ${createResponse.status}`);
      }

      const createData = await createResponse.json();
      const { paymentId, localPaymentId } = createData;

      console.log('[Demo Payment] Payment created:', paymentId);

      // Step 2: Approve payment (auto-approve in demo)
      console.log('[Demo Payment] Approving payment...');
      const approveResponse = await fetch(`${this.apiBase}/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, localPaymentId })
      });

      if (!approveResponse.ok) {
        throw new Error(`Failed to approve payment: ${approveResponse.status}`);
      }

      console.log('[Demo Payment] Payment approved');

      // Step 3: Complete payment (auto-complete in demo)
      console.log('[Demo Payment] Completing payment...');
      const completeResponse = await fetch(`${this.apiBase}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, localPaymentId, txid: `demo-tx-${Date.now()}` })
      });

      if (!completeResponse.ok) {
        throw new Error(`Failed to complete payment: ${completeResponse.status}`);
      }

      const completeData = await completeResponse.json();
      console.log('[Demo Payment] Payment completed:', completeData);

      return {
        success: true,
        paymentId,
        localPaymentId,
        amount,
        memo,
        status: 'demo_completed',
        message: 'Demo payment completed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Demo Payment] Error:', error);
      throw error;
    }
  }

  /**
   * Real Pi Browser SDK payment flow (3-phase)
   */
  async initiateRealPiPayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    return new Promise((resolve, reject) => {
      try {
        console.log('[Real Pi Payment] Starting 3-phase payment:', paymentConfig);

        window.Pi.createPayment(
          {
            amount: parseFloat(amount),
            memo: memo || 'AtlasPi payment',
            metadata: metadata || {}
          },
          {
            onReadyForServerApproval: async (paymentId) => {
              try {
                console.log('[Real Pi Payment] Phase I - Approving:', paymentId);
                const response = await fetch(`${this.apiBase}/api/pi-payments/approve`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId })
                });

                if (!response.ok) throw new Error(`Approval failed: ${response.status}`);
                console.log('[Real Pi Payment] Phase I complete');
              } catch (error) {
                console.error('[Real Pi Payment] Phase I error:', error);
                reject(error);
              }
            },

            onReadyForServerCompletion: async (paymentId, txid) => {
              try {
                console.log('[Real Pi Payment] Phase III - Completing:', { paymentId, txid });
                const response = await fetch(`${this.apiBase}/api/pi-payments/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid })
                });

                if (!response.ok) throw new Error(`Completion failed: ${response.status}`);
                const data = await response.json();
                console.log('[Real Pi Payment] Phase III complete');
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Real Pi payment completed',
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                console.error('[Real Pi Payment] Phase III error:', error);
                reject(error);
              }
            },

            onCancel: (paymentId) => {
              console.warn('[Real Pi Payment] Cancelled:', paymentId);
              reject(new Error(`Payment cancelled (${paymentId})`));
            },

            onError: (error) => {
              console.error('[Real Pi Payment] Error:', error);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('[Real Pi Payment] Initiation error:', error);
        reject(error);
      }
    });
  }

  getMode() {
    const currentMode = window.piIntegrationManager?.getMode() || 'demo';
    return this.isSdkReady() && currentMode !== 'demo' ? 'pi-browser-real' : 'demo-fallback';
  }

  getStatusMessage() {
    return this.getMode() === 'pi-browser-real' 
      ? '✅ Pi Browser Payment Ready (Official SDK)'
      : '⚠️ DEMO Payment Mode (Pi SDK not available)';
  }
}

// Export globally
if (typeof window !== 'undefined') {
  window.piBrowserPayments = new PiBrowserPayments();
}
