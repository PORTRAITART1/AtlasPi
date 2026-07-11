// ... (autres imports et classes)

class PiBrowserPayments {
  constructor() {
    this.sdkAvailable = this.detectPiSdk();
    this.paymentInProgress = false;
    this.lastPaymentAttempt = null;
    // Utiliser la configuration globale pour l'API Base URL
    this.apiBase = window.ATLASPI_CONFIG?.API_BASE_URL || 'https://atlaspi.onrender.com';

    console.log(`[PiBrowserPayments] Initialized. SDK Available: ${this.sdkAvailable}`);
  }

  detectPiSdk() {
    if (typeof window === 'undefined') {
      return false;
    }
    if (window.Pi && typeof window.Pi.createPayment === 'function') {
      console.log('[PiBrowserPayments] ✅ Official Pi SDK detected (window.Pi.createPayment)');
      return true;
    }
    console.log('[PiBrowserPayments] ❌ Pi SDK NOT available - running outside Pi Browser or SDK not loaded');
    return false;
  }

  isSdkReady() {
    return this.detectPiSdk();
  }

  refreshSdkStatus() {
    this.sdkAvailable = this.isSdkReady();
    console.log(`[PiBrowserPayments] SDK status refreshed: ${this.sdkAvailable}`);
  }

  async initiatePayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const currentMode = window.piIntegrationManager?.getMode() || 'demo';
    const isPiSdkAvailable = this.isSdkReady();

    console.log(`[PiBrowserPayments] Initiating payment. Mode: ${currentMode}, SDK Available: ${isPiSdkAvailable}`);

    this.paymentInProgress = true;
    this.lastPaymentAttempt = {
      timestamp: new Date().toISOString(),
      config: paymentConfig,
      mode: currentMode,
      sdkAvailable: isPiSdkAvailable
    };

    if (isPiSdkAvailable) {
      console.log('[PiBrowserPayments] Attempting REAL Pi Browser payment flow...');
      return this.initiateRealPiPayment(paymentConfig);
    } else {
      console.log('[PiBrowserPayments] Falling back to DEMO payment flow...');
      return new Promise((resolve, reject) => {
        if (window.triggerDemoPaymentFlow) {
          window.triggerDemoPaymentFlow(paymentConfig, resolve, reject);
        } else {
          // Fallback inline si triggerDemoPaymentFlow n'est pas défini
          console.warn('[PiBrowserPayments] triggerDemoPaymentFlow not found, using inline demo fallback');
          setTimeout(() => {
            this.paymentInProgress = false;
            resolve({
              success: true,
              demo: true,
              paymentId: 'demo_' + Date.now(),
              message: 'Demo payment simulated (inline fallback)',
              timestamp: new Date().toISOString()
            });
          }, 1500);
        }
      });
    }
  }

  async initiateRealPiPayment(paymentConfig) {
    const { amount, memo, metadata } = paymentConfig;

    return new Promise((resolve, reject) => {
      try {
        console.log('💳 Initiating official 3-phase payment:', paymentConfig);

        window.Pi.createPayment(
          {
            amount: parseFloat(amount),
            memo: memo || 'AtlasPi payment',
            metadata: metadata || {
              productType: 'atlaspi_vip',
              plan: 'vip_monthly',
              source: 'payments_page',
              amountLabel: '0.1'
            }
          },
          {
            onReadyForServerApproval: async (paymentId) => {
              try {
                console.log('💳 PHASE I: Server approval - paymentId:', paymentId);

                const approvalResponse = await fetch(`${this.apiBase}/api/pi/approve`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId })
                });

                if (!approvalResponse.ok) {
                  const errorData = await approvalResponse.json().catch(() => ({}));
                  throw new Error(`Approval failed: ${approvalResponse.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
                }
                const approvalData = await approvalResponse.json();
                console.log('✅ PHASE I complete: Payment approved by server', approvalData);
              } catch (error) {
                console.error('❌ PHASE I error:', error);
                this.paymentInProgress = false;
                reject(error);
              }
            },

            onReadyForServerCompletion: async (paymentId, txid) => {
              try {
                console.log('💳 PHASE II: Blockchain confirmed - txid:', txid);
                console.log('💳 PHASE III: Server completion starting...');

                const completionResponse = await fetch(`${this.apiBase}/api/pi/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid })
                });

                if (!completionResponse.ok) {
                  const errorData = await completionResponse.json().catch(() => ({}));
                  throw new Error(`Completion failed: ${completionResponse.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
                }
                const completionData = await completionResponse.json();
                console.log('✅ PHASE III complete: Payment completed successfully', completionData);

                this.paymentInProgress = false;
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Payment completed successfully via Pi Browser SDK',
                  timestamp: new Date().toISOString()
                });
              } catch (error) {
                console.error('❌ PHASE III error:', error);
                this.paymentInProgress = false;
                reject(error);
              }
            },

            onCancel: (paymentId) => {
              console.warn('💳 Payment cancelled by user. paymentId:', paymentId);
              this.paymentInProgress = false;
              reject(new Error(`Payment cancelled (id: ${paymentId})`));
            },

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

  getMode() {
    const currentMode = window.piIntegrationManager?.getMode() || 'demo';
    if (this.isSdkReady() && currentMode !== 'demo') {
      return 'pi-browser-real';
    } else {
      return 'demo-fallback';
    }
  }

  getStatusMessage() {
    const mode = this.getMode();
    if (mode === 'pi-browser-real') {
      return '✅ Pi Browser Payment Ready (Official SDK)';
    } else {
      return '⚠️ DEMO Payment Mode (Pi SDK not available or in demo mode)';
    }
  }

  getLastPaymentStatus() {
    return this.lastPaymentAttempt || { message: 'No payment attempted yet' };
  }
}

// Exposer globalement
if (typeof window !== 'undefined') {
  window.PiBrowserPayments = PiBrowserPayments;
  window.piBrowserPayments = new PiBrowserPayments();
}
