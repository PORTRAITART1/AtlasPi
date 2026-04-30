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
   * Initiate payment - ALWAYS use demo mode unless explicitly in production Pi mode
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
      // FORCE DEMO MODE unless explicitly in production
      // If mode is 'demo' (the default), ALWAYS use demo payment flow
      // regardless of Pi SDK availability
      if (currentMode === 'demo') {
        console.log('[PiBrowserPayments] DEMO mode detected - using demo payment flow (instant auto-approval)');
        return await this.initiateDemoPayment(paymentConfig);
      } 
      // Only use real Pi SDK if explicitly NOT in demo mode AND Pi SDK is available
      else if (isPiSdkAvailable && currentMode !== 'demo') {
        console.log('[PiBrowserPayments] Production mode with Pi SDK detected - using 3-phase payment flow');
        return await this.initiateRealPiPayment(paymentConfig);
      } 
      // Fallback: demo mode if SDK not available
      else {
        console.log('[PiBrowserPayments] Falling back to demo payment (Pi SDK not available)');
        return await this.initiateDemoPayment(paymentConfig);
      }
    } finally {
      this.paymentInProgress = false;
    }
  }

  /**
   * Demo payment flow - calls backend demo endpoints (instant auto-approval)
   */
  async initiateDemoPayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    try {
      // Step 1: Create payment record
      console.log('[Demo Payment] Creating payment record...');
      const createResponse = await fetch(`${this.apiBase}/api/payments/create-record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, memo, metadata: metadata || {} })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(`Failed to create payment: ${createResponse.status} - ${errorData.error || 'Unknown error'}`);
      }

      const createData = await createResponse.json();
      const { paymentId, localPaymentId } = createData;

      console.log('[Demo Payment] Payment created:', paymentId);

      // Step 2: Auto-approve payment (demo only)
      console.log('[Demo Payment] Auto-approving payment...');
      const approveResponse = await fetch(`${this.apiBase}/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, localPaymentId })
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json().catch(() => ({}));
        throw new Error(`Failed to approve payment: ${approveResponse.status} - ${errorData.error || 'Unknown error'}`);
      }

      console.log('[Demo Payment] Payment auto-approved');

      // Step 3: Auto-complete payment (demo only)
      console.log('[Demo Payment] Auto-completing payment...');
      const completeResponse = await fetch(`${this.apiBase}/api/payments/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentId, 
          localPaymentId, 
          txid: `demo-tx-${Date.now()}` 
        })
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        throw new Error(`Failed to complete payment: ${completeResponse.status} - ${errorData.error || 'Unknown error'}`);
      }

      const completeData = await completeResponse.json();
      console.log('[Demo Payment] Payment auto-completed:', completeData);

      return {
        success: true,
        paymentId,
        localPaymentId,
        amount,
        memo,
        status: 'completed',
        message: 'Demo payment completed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Demo Payment] Error:', error);
      throw error;
    }
  }

  /**
   * Real Pi Browser SDK payment flow (3-phase with backend approval)
   * Only used when NOT in demo mode AND Pi SDK is available
   */
  async initiateRealPiPayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    return new Promise((resolve, reject) => {
      try {
        console.log('[Real Pi Payment] Starting 3-phase payment with backend approval:', paymentConfig);

        window.Pi.createPayment(
          {
            amount: parseFloat(amount),
            memo: memo || 'AtlasPi payment',
            metadata: metadata || {}
          },
          {
            // Phase 1: Pi SDK ready for server approval
            onReadyForServerApproval: async (paymentId) => {
              try {
                console.log('[Real Pi Payment] Phase 1 - Server approval for:', paymentId);
                
                // Call backend to approve the payment
                const response = await fetch(`${this.apiBase}/api/pi-payments/approve`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId })
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(`Approval failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
                }
                
                const approvalData = await response.json();
                console.log('[Real Pi Payment] Phase 1 complete - server approved:', approvalData);
                // Phase 1 complete, wait for Phase 2 (blockchain confirmation)
              } catch (error) {
                console.error('[Real Pi Payment] Phase 1 error:', error);
                reject(error);
              }
            },

            // Phase 2 & 3: Blockchain confirmed, ready for server completion
            onReadyForServerCompletion: async (paymentId, txid) => {
              try {
                console.log('[Real Pi Payment] Phase 3 - Server completion for:', paymentId, 'txid:', txid);
                
                // Call backend to complete the payment
                const response = await fetch(`${this.apiBase}/api/pi-payments/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid })
                });

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(`Completion failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
                }
                
                const completionData = await response.json();
                console.log('[Real Pi Payment] Phase 3 complete - payment completed:', completionData);
                
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Real Pi payment completed successfully',
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                console.error('[Real Pi Payment] Phase 3 error:', error);
                reject(error);
              }
            },

            // User or system cancelled the payment
            onCancel: (paymentId) => {
              console.warn('[Real Pi Payment] Cancelled by user:', paymentId);
              reject(new Error(`Payment cancelled (${paymentId})`));
            },

            // Error occurred during payment flow
            onError: (error) => {
              console.error('[Real Pi Payment] SDK error:', error);
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
    return currentMode === 'demo' ? 'demo-fallback' : 'pi-browser-real';
  }

  getStatusMessage() {
    return this.getMode() === 'pi-browser-real' 
      ? '✅ Pi Browser Payment Ready (Official SDK)'
      : '⚠️ DEMO Payment Mode (instant auto-approval)';
  }
}

// Export globally
if (typeof window !== 'undefined') {
  window.piBrowserPayments = new PiBrowserPayments();
}
