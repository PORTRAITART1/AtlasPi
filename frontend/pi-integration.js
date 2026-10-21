/**
 * pi-integration.js
 * Gestion centralisÃ©e de l'intÃ©gration Pi SDK
 * - DÃ©tection du mode backend
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

    // âœ… Restaurer immÃ©diatement la session au chargement de la page
    this.restoreSession();

    // âœ… Initialiser le SDK aprÃ¨s rÃ©cupÃ©ration du mode backend
    this.fetchBackendMode()
      .then(() => this.initPiSdk())
      .catch((err) => {
        console.warn('[Pi Integration] Mode fetch failed â€“ keeping default mode:', err?.message || err);
        this.initPiSdk();
      });
  }

  // -------------------------------------------------------------------------
  // Restauration de session depuis localStorage
  // -------------------------------------------------------------------------
  restoreSession() {
    try {
      return null; // SUPPRIMÉ - Conformité Pi : pas de restauration depuis localStorage
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

      // âœ… CompatibilitÃ© avec les autres scripts/pages
      localStorage.setItem('pi_user_id', this.user.uid);
      localStorage.setItem('pi_username', this.user.username || '');

      if (this.accessToken) {
        localStorage.setItem('pi_access_token', this.accessToken);
      }

      console.log('[Pi Integration] Session restaurÃ©e depuis localStorage :', this.user.username || this.user.uid);

      // âœ… Notifier les scripts dÃ©jÃ  chargÃ©s
      window.dispatchEvent(new CustomEvent('piUserLoggedIn', {
        detail: {
          ...this.user,
          accessToken: this.accessToken,
          restored: true
        }
      }));

      // âœ… Notifier aussi aprÃ¨s DOMContentLoaded si l'UI n'Ã©tait pas encore prÃªte
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

    console.log('[Pi Integration] Session persistÃ©e :', cleanUser.username || cleanUser.uid);
  }

  // -------------------------------------------------------------------------
  // RÃ©cupÃ©ration du mode backend
  // -------------------------------------------------------------------------
  async fetchBackendMode() {
    try {
      const res = await fetch(`${this.backendUrl}/api/payments/network/info`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data && data.mode) {
        this.mode = data.mode;
        console.log(`[Pi Integration] Mode backend rÃ©cupÃ©rÃ© : ${this.mode}`);
      }

      return this.mode;
    } catch (err) {
      console.warn('[Pi Integration] Impossible de rÃ©cupÃ©rer le mode backend :', err.message);
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

  // Ne pas crÃ©er de session automatique si le SDK Pi est absent.
      // Le mode backend courant est conservÃ© si le SDK Pi est absent.

      return;
    }

    try {
      const sandbox = this.mode === 'pirc2-sandbox';

      Pi.init({
        version: '2.0',
        sandbox
      });

      this.sdkAvailable = true;

      console.log(`[Pi Integration] Pi SDK initialisÃ© (sandbox=${sandbox}, mode=${this.mode})`);
    } catch (err) {
      console.error('[Pi Integration] Erreur initialisation Pi SDK :', err);
      this.sdkAvailable = false;
      // Conserver le mode courant si l'initialisation SDK Ã©choue.
    }
  }

  // -------------------------------------------------------------------------
  // Authentification
  // -------------------------------------------------------------------------
  async authenticate(scopes = ['username', 'payments']) {
    // âœ… VÃ©rifier/restaurer session existante avant de relancer Pi.authenticate
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

// Pi SDK indisponible : authentification rÃ©elle impossible
if (!this.sdkAvailable || !window.Pi) {
  console.warn('[Pi Integration] Pi SDK indisponible. Authentification rÃ©elle impossible.');

  return {
    ok: false,
    user: null,
    accessToken: null,
    mode: 'unavailable',
    error: 'Pi SDK indisponible. Ouvrez AtlasPi dans Pi Browser.'
  };
}

    // Authentification Pi SDK rÃ©elle
    return await this.authPiSdk(scopes);
  }

  // -------------------------------------------------------------------------
  // Authentification via Pi SDK
  // -------------------------------------------------------------------------
  async authPiSdk(scopes = ['username', 'payments']) {
    try {
      const authResult = await Pi.authenticate(scopes, (payment) => {
        console.warn('[Pi Integration] Paiement incomplet dÃ©tectÃ© :', payment);
      });

      const user = authResult && authResult.user ? authResult.user : null;
      const accessToken = authResult && authResult.accessToken ? authResult.accessToken : null;

      if (!user || !user.uid) {
        throw new Error('Pi SDK authentication returned no user');
      }

      // âœ… Persister user + accessToken
      this.persistSession(user, accessToken);

      console.log('[Pi Integration] Authentification Pi SDK rÃ©ussie :', user.username || user.uid);

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
  // DÃ©connexion
  // -------------------------------------------------------------------------
  logout() {
    this.user = null;
    this.accessToken = null;

    localStorage.removeItem('piUser');
    localStorage.removeItem('pi_user_id');
    localStorage.removeItem('pi_username');
    localStorage.removeItem('pi_access_token');

    window.dispatchEvent(new CustomEvent('piUserLoggedOut'));

    console.log('[Pi Integration] Utilisateur dÃ©connectÃ©');
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
      return 'âš ï¸ Pi SDK not available. Please open AtlasPi inside Pi Browser and try again.';
    }

    switch (mode) {

      case 'pi-ready':
        return 'âœ… Piâ€‘READY mode - Ready for Pi SDK authentication';
      case 'pirc2-sandbox':
        return 'âœ… SANDBOX mode - Ready for Pi SDK authentication (sandbox)';
      case 'pirc2-production':
        return 'âœ… PRODUCTION mode - Requires real Pi SDK and credentials';
      default:
        return 'â„¹ï¸ Unknown mode';
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

// âœ… Exposition globale
if (typeof window !== 'undefined') {
  window.piIntegrationManager = new PiIntegrationManager();

  // âœ… Helper global utile pour les pages qui veulent forcer la restauration
  window.restorePiSession = function restorePiSession() {
    return window.piIntegrationManager.restoreSession();
  };
}

