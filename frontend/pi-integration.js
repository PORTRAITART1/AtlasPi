/**
 * pi-integration.js
 * Gestion centralisée de l'intégration Pi SDK
 * - Détection du mode backend
 * - Initialisation du SDK Pi
 * - Authentification
 * - Persistance de session
 */

class PiIntegrationManager {
  constructor() {
    this.mode = 'demo';
    this.sdkAvailable = false;
    this.user = null;
    this.backendUrl = 'https://atlaspi-backend.onrender.com';

    // ✅ Fix 2 — Initialiser le SDK après récupération du mode
    this.fetchBackendMode()
      .then(() => this.initPiSdk())
      .catch(() => {
        console.warn('[Pi Integration] Mode fetch failed – keeping default mode');
      });
  }

  // -------------------------------------------------------------------------
  // Récupération du mode backend
  // -------------------------------------------------------------------------
  async fetchBackendMode() {
    try {
      const res = await fetch(`${this.backendUrl}/api/mode`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.mode) {
        this.mode = data.mode;
        console.log(`[Pi Integration] Mode backend récupéré : ${this.mode}`);
      }
    } catch (err) {
      console.warn('[Pi Integration] Impossible de récupérer le mode backend :', err.message);
    }
  }

  // -------------------------------------------------------------------------
  // Initialisation du SDK Pi
  // -------------------------------------------------------------------------
  async initPiSdk() {
    if (typeof window === 'undefined') return;

    if (typeof Pi === 'undefined') {
      console.warn('[Pi Integration] Pi SDK non disponible – mode DEMO activé');
      this.sdkAvailable = false;
      this.mode = 'demo';
      return;
    }

    try {
      const sandbox = this.mode === 'pirc2-sandbox';
      Pi.init({ version: '2.0', sandbox });
      this.sdkAvailable = true;
      console.log(`[Pi Integration] Pi SDK initialisé (sandbox=${sandbox}, mode=${this.mode})`);
    } catch (err) {
      console.error('[Pi Integration] Erreur initialisation Pi SDK :', err);
      this.sdkAvailable = false;
      this.mode = 'demo';
    }
  }

  // -------------------------------------------------------------------------
  // Authentification
  // -------------------------------------------------------------------------
  async authenticate(scopes = ['username', 'payments']) {
    // Vérifier session existante
    try {
      const stored = localStorage.getItem('piUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          this.user = parsed;
          console.log('[Pi Integration] Session restaurée depuis localStorage :', parsed.username);
          return { ok: true, user: this.user, mode: this.mode, fromCache: true };
        }
      }
    } catch (e) {
      console.warn('[Pi Integration] Erreur lecture localStorage :', e);
    }

    // Mode DEMO
    if (this.mode === 'demo' || !this.sdkAvailable) {
      const demoUser = {
        uid: 'demo-uid-' + Date.now(),
        username: 'demo_pioneer',
        wallet_address: null
      };
      this.user = demoUser;
      localStorage.setItem('piUser', JSON.stringify(demoUser));
      window.dispatchEvent(new CustomEvent('piUserLoggedIn', { detail: demoUser }));
      console.log('[Pi Integration] Authentification DEMO :', demoUser.username);
      return { ok: true, user: demoUser, mode: 'demo' };
    }

    // Authentification Pi SDK réelle
    return await this.authPiSdk(scopes);
  }

  // -------------------------------------------------------------------------
  // Authentification via Pi SDK
  // -------------------------------------------------------------------------
  async authPiSdk(scopes = ['username', 'payments']) {
    try {
      const authResult = await Pi.authenticate(scopes, (payment) => {
        console.warn('[Pi Integration] Paiement incomplet détecté :', payment);
      });

      // ✅ Fix 1 — Persister la session
      this.user = authResult.user;

      if (this.user) {
        localStorage.setItem('piUser', JSON.stringify({
          uid: this.user.uid,
          username: this.user.username,
          wallet_address: this.user.wallet_address || null
        }));
        // Notifier les autres scripts
        window.dispatchEvent(new CustomEvent('piUserLoggedIn', { detail: this.user }));
        console.log('[Pi Integration] Authentification Pi SDK réussie :', this.user.username);
      }

      return { ok: true, user: this.user, mode: this.mode };
    } catch (error) {
      console.error('[Pi Auth] Pi SDK authentication failed:', error);
      return { ok: false, error: error.message || 'Pi SDK authentication error', mode: this.mode };
    }
  }

  // -------------------------------------------------------------------------
  // Déconnexion
  // -------------------------------------------------------------------------
  logout() {
    this.user = null;
    localStorage.removeItem('piUser');
    window.dispatchEvent(new CustomEvent('piUserLoggedOut'));
    console.log('[Pi Integration] Utilisateur déconnecté');
  }

  // -------------------------------------------------------------------------
  // Getters / status helpers
  // -------------------------------------------------------------------------
  getUser() {
    return this.user;
  }

  getMode() {
    return this.mode;
  }

  isDemoMode() {
    return this.mode === 'demo';
  }

  isPiSdkAvailable() {
    return this.sdkAvailable;
  }

  getStatusMessage() {
    const sdkAvailable = this.isPiSdkAvailable();
    const mode = this.getMode();

    if (!sdkAvailable) {
      return '⚠️ Pi SDK not available - using DEMO mode fallback';
    }

    switch (mode) {
      case 'demo':
        return '✅ DEMO mode - Mock authentication';
      case 'pi-ready':
      case 'pirc2-sandbox':
        return '✅ Pi‑READY mode - Ready for Pi SDK authentication (sandbox)';
      case 'pirc2-production':
        return '✅ PRODUCTION mode - Requires real Pi SDK and credentials';
      default:
        return 'ℹ️ Unknown mode';
    }
  }

  getAuthStatus() {
    return {
      mode: this.mode,
      isDemoMode: this.isDemoMode(),
      sdkAvailable: this.sdkAvailable,
      user: this.user,
      statusMessage: this.getStatusMessage(),
      timestamp: new Date().toISOString()
    };
  }
}

// ✅ Exposition globale
if (typeof window !== 'undefined') {
  window.piIntegrationManager = new PiIntegrationManager();
}
