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
  paymentId?: string; // Peut être null si le paiement échoue avant l'approbation serveur
  txid?: string;
  message: string;
  mode?: string; // Pour indiquer le mode utilisé (real, demo)
}

class PiPaymentService {
  private static apiClient: AxiosInstance;
  // Utiliser la configuration globale pour l'API Base URL
  private static apiBase = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000'; // Fallback

  /**
   * Initialise le client API avec le token d'authentification
   */
  static initializeClient() {
    this.apiClient = axios.create({
      baseURL: this.apiBase,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Ajouter le token d'accès à toutes les requêtes
    this.apiClient.interceptors.request.use(config => {
      // NOTE: Le token d'accès pour les paiements réels Pi pourrait être différent
      // et géré par le Pi SDK lui-même ou via une authentification backend spécifique.
      // Pour l'instant, on suppose qu'il pourrait être stocké localement.
      const token = localStorage.getItem('pi_access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Crée un paiement Pi (U2A - User to App)
   * 
   * Flow:
   * 1. Frontend appelle Pi.createPayment()
   * 2. onReadyForServerApproval → backend approuve (route dédiée)
   * 3. User signe la transaction sur la blockchain
   * 4. onReadyForServerCompletion → backend complète (route dédiée)
   * 5. Le flux de paiement se ferme
   */
  static async createPayment(config: PaymentConfig): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      // Vérifier si le SDK Pi est disponible
      if (!window.Pi || typeof window.Pi.createPayment !== 'function') {
        console.warn('[PiPaymentService] Pi SDK not available. Falling back to DEMO payment.');
        // Appel au gestionnaire de paiement démo global
        if (window.triggerDemoPaymentFlow) {
          window.triggerDemoPaymentFlow(config, resolve, reject);
        } else {
          reject(new Error('Pi SDK not available and no demo payment handler found.'));
        }
        return;
      }

      // Initialiser le client API si ce n'est pas déjà fait
      if (!this.apiClient) {
        this.initializeClient();
      }

      console.log('Creating Pi payment via SDK:', config);

      // Créer le paiement via Pi SDK
      window.Pi.createPayment(
        {
          amount: parseFloat(config.amount),
          memo: config.memo,
          metadata: config.metadata || {}
        },
        {
          /**
           * PHASE I: Approbation Côté Serveur
           * Pi SDK a obtenu le paymentId, attend que le serveur approuve
           */
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              console.log('💳 PHASE I: Server approval for payment:', paymentId);

              // Envoyer paymentId au backend pour approbation (route dédiée pour Pi réel)
              const response = await this.apiClient.post<PaymentResult>(
                '/api/payments/approve-pi-real', // Nouvelle route backend
                { paymentId }
              );

              if (response.status === 200 && response.data.success) {
                console.log('✅ Payment approved by server:', response.data);
                // Ne rien faire ici, le SDK Pi continue automatiquement
              } else {
                throw new Error(response.data.message || 'Payment approval failed');
              }
            } catch (error: any) {
              console.error('❌ Payment approval failed:', error.message);
              reject(new Error(`Payment approval failed: ${error.message}`));
            }
          },

          /**
           * PHASE III: Complétion Côté Serveur
           * Transaction blockchain terminée, Pi SDK a le txid
           * Le serveur doit compléter le paiement
           */
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              console.log('💳 PHASE III: Server completion for payment:', {
                paymentId,
                txid
              });

              // Envoyer txid au backend pour complétion (route dédiée pour Pi réel)
              const response = await this.apiClient.post<PaymentResult>(
                '/api/payments/complete-pi-real', // Nouvelle route backend
                { paymentId, txid }
              );

              if (response.status === 200 && response.data.success) {
                console.log('✅ Payment completed successfully:', response.data);
                resolve({
                  success: true,
                  paymentId,
                  txid,
                  message: 'Payment completed successfully via Pi Browser SDK',
                  mode: 'real' // Indiquer que c'était un paiement réel
                });
              } else {
                throw new Error(response.data.message || 'Payment completion failed');
              }
            } catch (error: any) {
              console.error('❌ Payment completion failed:', error.message);
              reject(new Error(`Payment completion failed: ${error.message}`));
            }
          },

          /**
           * Gestionnaire d'erreurs
           */
          onError: (error: Error) => {
            console.error('❌ Payment error:', error);
            reject(error);
          }
        }
      );
    });
  }

  // ... (getPaymentStatus, getUserPayments - non modifiés pour l'instant)
}

// Exposer globalement pour être utilisé par script.js
if (typeof window !== 'undefined') {
  window.PiPaymentService = PiPaymentService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PiPaymentService;
}
