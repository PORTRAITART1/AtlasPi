// ... (autres imports et classes)

class PiBrowserPayments {
  constructor() {
    this.sdkAvailable = this.detectPiSdk();
    this.paymentInProgress = false;
    this.lastPaymentAttempt = null;
    // Utiliser la configuration globale pour l'API Base URL
    this.apiBase = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000'; // Fallback

    console.log(`[PiBrowserPayments] Initialized. SDK Available: ${this.sdkAvailable}`);
  }

  // -------------------------------------------------------------------------
  // SDK detection (dynamic)
  // -------------------------------------------------------------------------
  detectPiSdk() {
    if (typeof window === 'undefined') {
      return false;
    }
    // Vérifie la présence de l'API officielle pour les paiements
    if (window.Pi && typeof window.Pi.createPayment === 'function') {
      console.log('[PiBrowserPayments] ✅ Official Pi SDK detected (window.Pi.createPayment)');
      return true;
    }
    console.log('[PiBrowserPayments] ❌ Pi SDK NOT available - running outside Pi Browser or SDK not loaded');
    return false;
  }

  /**
   * Méthode publique pour obtenir l'état actuel du SDK.
   * Elle effectue une détection dynamique à chaque appel afin de refléter
   * les changements de disponibilité (ex. script chargé après l'instanciation).
   */
  isSdkReady() {
    return this.detectPiSdk();
  }

  /**
   * Si besoin, on peut rafraîchir la propriété sdkAvailable (pour compatibilité
   * avec du code qui l'utilise directement). Cette méthode n'est pas obligatoire
   * pour le flow principal mais permet de garder l'ancienne API fonctionnelle.
   */
  refreshSdkStatus() {
    this.sdkAvailable = this.isSdkReady();
    console.log(`[PiBrowserPayments] SDK status refreshed: ${this.sdkAvailable}`);
  }

  /**
   * Déclenche le paiement : Pi réel si SDK dispo, sinon fallback démo.
   */
  async initiatePayment(paymentConfig) {
    const { amount, memo } = paymentConfig;

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    // Détermine le mode actuel
    const currentMode = window.piIntegrationManager?.getMode() || 'demo'; // Utilise le manager global si dispo
    const isPiSdkAvailable = this.isSdkReady();

    console.log(`[PiBrowserPayments] Initiating payment. Mode: ${currentMode}, SDK Available: ${isPiSdkAvailable}`);

    this.paymentInProgress = true;
    this.lastPaymentAttempt = {
      timestamp: new Date().toISOString(),
      config: paymentConfig,
      mode: currentMode,
      sdkAvailable: isPiSdkAvailable
    };

    // Si le SDK Pi est disponible ET que le mode n'est PAS 'demo'
    if (isPiSdkAvailable && currentMode !== 'demo') {
      console.log('[PiBrowserPayments] Attempting REAL Pi Browser payment flow...');
      return this.initiateRealPiPayment(paymentConfig);
    } else {
      console.log('[PiBrowserPayments] Falling back to DEMO payment flow...');
      // Appel au gestionnaire de paiement démo (qui sera appelé via script.js)
      // On retourne une promesse qui sera résolue par le gestionnaire démo
      return new Promise((resolve, reject) => {
        // On passe les infos de paiement au gestionnaire démo
        // Assurez-vous que window.triggerDemoPaymentFlow est défini globalement
        if (window.triggerDemoPaymentFlow) {
          window.triggerDemoPaymentFlow(paymentConfig, resolve, reject);
        } else {
          console.error("Demo payment flow handler (window.triggerDemoPaymentFlow) not found!");
          this.paymentInProgress = false;
          reject(new Error("Demo payment flow handler not found."));
        }
      });
    }
  }

  /**
   * Flow de paiement Pi Browser OFFICIEL (3 phases)
   */
  async initiateRealPiPayment(paymentConfig) {
    const { amount, memo } = paymentConfig;

    return new Promise((resolve, reject) => {
      try {
        console.log('💳 Initiating official 3-phase payment:', paymentConfig);

        window.Pi.createPayment(
          {
            amount: parseFloat(amount),
            memo: memo || 'AtlasPi payment',
            // metadata: { ... } // Peut être ajouté si nécessaire
          },
          {
            onReadyForServerApproval: async (paymentId) => {
              try {
                console.log('💳 PHASE I: Server approval - paymentId:', paymentId);
                // Appel au backend pour approuver le paiement
                const approvalResponse = await fetch(`${this.apiBase}/api/payments/approve-pi-real`, { // Nouvelle route backend
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    // Ajouter l'auth si nécessaire (ex: token utilisateur)
                    // 'Authorization': `Bearer ${localStorage.getItem('pi_access_token') || ''}`
                  },
                  body: JSON.stringify({ paymentId })
                });

                if (!approvalResponse.ok) {
                  const errorData = await approvalResponse.json().catch(() => ({})); // Catch potential JSON parse error
                  throw new Error(`Approval failed: ${approvalResponse.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
                }
                const approvalData = await approvalResponse.json();
                console.log('✅ PHASE I complete: Payment approved by server', approvalData);
                // Ne pas résoudre ici, attendre la phase III
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

                // Appel au backend pour compléter le paiement
                const completionResponse = await fetch(`${this.apiBase}/api/payments/complete-pi-real`, { // Nouvelle route backend
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    // Ajouter l'auth si nécessaire
                    // 'Authorization': `Bearer ${localStorage.getItem('pi_access_token') || ''}`
                  },
                  body: JSON.stringify({ paymentId, txid })
                });

                if (!completionResponse.ok) {
                  const errorData = await completionResponse.json().catch(() => ({})); // Catch potential JSON parse error
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
              console.warn('💳 Payment cancelled by user or programmatically. paymentId:', paymentId);
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

  // ... (autres méthodes comme getMode, getStatus, etc.)
  getMode() {
    const currentMode = window.piIntegrationManager?.getMode() || 'demo';
    if (this.isSdkReady() && currentMode !== 'demo') {
      return 'pi-browser-real'; // Indique que le vrai flow est prêt
    } else {
      return 'demo-fallback'; // Indique que le fallback démo est utilisé
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
}

// Exposer globalement
if (typeof window !== 'undefined') {
  window.piBrowserPayments = new PiBrowserPayments(); // Instancier globalement
}
