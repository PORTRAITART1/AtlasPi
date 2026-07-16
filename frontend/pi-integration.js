/**
 * pi-integration.js
 * Gestion centralisée de l'intégration Pi SDK
 * - Détection du mode backend
 * - Initialisation du SDK Pi
 * - Authentification
 * - Persistance + restauration de session
 */

class PiIntegrationManager {
  constructor() {
    this.mode = 'uninitialized';
    this.sdkAvailable = false;
    this.user = null;
    this.accessToken = null;
    this.backendUrl = 'https://atlaspi-backend.onrender.com';

    // ✅ Restaurer immédiatement la session au chargement de la page
    this.restoreSession();

    // ✅ Initialiser le SDK après récupération du mode backend
    this.fetchBackendMode()
      .then(() => this.initPiSdk())
      .catch((err) => {
        console.warn('[Pi Integration] Mode fetch failed – keeping default mode:', err?.message || err);
        this.initPiSdk();
      });
  }

  // -------------------------------------------------------------------------
  // Restauration de session depuis localStorage
  // -------------------------------------------------------------------------
  restoreSession() {
    try {
      const stored = localStorage.getItem('piUser');

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);

      if (!parsed || !parsed.uid) {
        localStorage.removeItem('piUser');
        return null;
      }

      this.user = {
        uid: parsed.uid,
        username: parsed.username || '',
        wallet_address: parsed.wallet_address || null
      };

      this.accessToken = parsed.accessToken || localStorage.getItem('pi_access_token') || null;

      // ✅ Compatibilité avec les autres scripts/pages
      localStorage.setItem('pi_user_id', this.user.uid);
      localStorage.setItem('pi_username', this.user.username || '');

      if (this.accessToken) {
        localStorage.setItem('pi_access_token', this.accessToken);
      }

      console.log('[Pi Integration] Session restaurée depuis localStorage :', this.user.username || this.user.uid);

      // ✅ Notifier les scripts déjà chargés
      window.dispatchEvent(new CustomEvent('piUserLoggedIn', {
        detail: {
          ...this.user,
          accessToken: this.accessToken,
          restored: true
        }
      }));

      // ✅ Notifier aussi après DOMContentLoaded si l'UI n'était pas encore prête
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          window.dispatchEvent(new CustomEvent('piUserLoggedIn', {
            detail: {
              ...this.user,
              accessToken: this.accessToken,
              restored: true
            }
          }));
        }, { once: true });
      } else {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('piUserLoggedIn', {
            detail: {
              ...this.user,
              accessToken: this.accessToken,
              restored: true
            }
          }));
        }, 0);
      }

      return this.user;
    } catch (e) {
      console.warn('[Pi Integration] Erreur restauration session localStorage :', e);
      localStorage.removeItem('piUser');
      localStorage.removeItem('pi_user_id');
      localStorage.removeItem('pi_username');
      localStorage.removeItem('pi_access_token');
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Sauvegarde de session
  // -------------------------------------------------------------------------
  persistSession(user, accessToken = null) {
    if (!user || !user.uid) {
      return;
    }

    const cleanUser = {
      uid: user.uid,
      username: user.username || '',
      wallet_address: user.wallet_address || null,
      accessToken: accessToken || null,
      savedAt: new Date().toISOString()
    };

    this.user = {
      uid: cleanUser.uid,
      username: cleanUser.username,
      wallet_address: cleanUser.wallet_address
    };

    this.accessToken = accessToken || null;

    localStorage.setItem('piUser', JSON.stringify(cleanUser));
    localStorage.setItem('pi_user_id', cleanUser.uid);
    localStorage.setItem('pi_username', cleanUser.username || '');

    if (accessToken) {
      localStorage.setItem('pi_access_token', accessToken);
    }

    window.dispatchEvent(new CustomEvent('piUserLoggedIn', {
      detail: {
        ...this.user,
        accessToken: this.accessToken
      }
    }));

    console.log('[Pi Integration] Session persistée :', cleanUser.username || cleanUser.uid);
  }

  // -------------------------------------------------------------------------
  // Récupération du mode backend
  // -------------------------------------------------------------------------
  async fetchBackendMode() {
    try {
      const res = await fetch(`${this.backendUrl}/api/mode`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data && data.mode) {
        this.mode = data.mode;
        console.log(`[Pi Integration] Mode backend récupéré : ${this.mode}`);
      }

      return this.mode;
    } catch (err) {
      console.warn('[Pi Integration] Impossible de récupérer le mode backend :', err.message);
      return this.mode;
    }
  }

  // -------------------------------------------------------------------------
  // Initialisation du SDK Pi
  // -------------------------------------------------------------------------
  async initPiSdk() {
    if (typeof window === 'undefined') return;

    if (typeof Pi === 'undefined') {
      console.warn('[Pi Integration] Pi SDK non disponible');
      this.sdkAvailable = false;

  // Ne pas créer de session automatique si le SDK Pi est absent.
      // Le mode backend courant est conservé si le SDK Pi est absent.

      return;
    }

    try {
      const sandbox = this.mode === 'pirc2-sandbox' || this.mode === 'pi-ready';

      Pi.init({
        version: '2.0',
        sandbox
      });

      this.sdkAvailable = true;

      console.log(`[Pi Integration] Pi SDK initialisé (sandbox=${sandbox}, mode=${this.mode})`);
    } catch (err) {
      console.error('[Pi Integration] Erreur initialisation Pi SDK :', err);
      this.sdkAvailable = false;
      // Conserver le mode courant si l'initialisation SDK échoue.
    }
  }

  // -------------------------------------------------------------------------
  // Authentification
  // -------------------------------------------------------------------------
  async authenticate(scopes = ['username', 'payments']) {
    // ✅ Vérifier/restaurer session existante avant de relancer Pi.authenticate
    const restored = this.restoreSession();

    if (restored && restored.uid) {
      return {
        ok: true,
        user: this.user,
        accessToken: this.accessToken,
        mode: this.mode,
        fromCache: true
      };
    }

// Pi SDK indisponible : authentification réelle impossible
if (!this.sdkAvailable || !window.Pi) {
  console.warn('[Pi Integration] Pi SDK indisponible. Authentification réelle impossible.');

  return {
    ok: false,
    user: null,
    accessToken: null,
    mode: 'unavailable',
    error: 'Pi SDK indisponible. Ouvrez AtlasPi dans Pi Browser.'
  };
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

      const user = authResult && authResult.user ? authResult.user : null;
      const accessToken = authResult && authResult.accessToken ? authResult.accessToken : null;

      if (!user || !user.uid) {
        throw new Error('Pi SDK authentication returned no user');
      }

      // ✅ Persister user + accessToken
      this.persistSession(user, accessToken);

      console.log('[Pi Integration] Authentification Pi SDK réussie :', user.username || user.uid);

      return {
        ok: true,
        user: this.user,
        accessToken: this.accessToken,
        mode: this.mode
      };
    } catch (error) {
      console.error('[Pi Auth] Pi SDK authentication failed:', error);

      return {
        ok: false,
        error: error.message || 'Pi SDK authentication error',
        mode: this.mode
      };
    }
  }

  // -------------------------------------------------------------------------
  // Déconnexion
  // -------------------------------------------------------------------------
  logout() {
    this.user = null;
    this.accessToken = null;

    localStorage.removeItem('piUser');
    localStorage.removeItem('pi_user_id');
    localStorage.removeItem('pi_username');
    localStorage.removeItem('pi_access_token');

    window.dispatchEvent(new CustomEvent('piUserLoggedOut'));

    console.log('[Pi Integration] Utilisateur déconnecté');
  }

  // -------------------------------------------------------------------------
  // Getters / status helpers
  // -------------------------------------------------------------------------
  getUser() {
    if (!this.user) {
      this.restoreSession();
    }

    return this.user;
  }

  getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('pi_access_token') || null;
    }

    return this.accessToken;
  }

  getMode() {
    return this.mode;
  }



  isPiSdkAvailable() {
    return this.sdkAvailable;
  }

  getStatusMessage() {
    const sdkAvailable = this.isPiSdkAvailable();
    const mode = this.getMode();

    if (!sdkAvailable) {
      return '⚠️ Pi SDK not available. Please open AtlasPi inside Pi Browser and try again.';
    }

    switch (mode) {

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
      sdkAvailable: this.sdkAvailable,
      user: this.getUser(),
      accessToken: this.getAccessToken(),
      statusMessage: this.getStatusMessage(),
      timestamp: new Date().toISOString()
    };
  }
}

// ✅ Exposition globale
if (typeof window !== 'undefined') {
  window.piIntegrationManager = new PiIntegrationManager();

  // ✅ Helper global utile pour les pages qui veulent forcer la restauration
  window.restorePiSession = function restorePiSession() {
    return window.piIntegrationManager.restoreSession();
  };
}
