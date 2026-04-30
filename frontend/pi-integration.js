// ... (début de la classe)

class PiIntegrationManager {
  constructor() {
    this.mode = this.detectMode();
    this.sdkAvailable = this.detectPiSdk(); // initial detection (may be false until script loads)
    this.user = null;
    this.config = this.initConfig();

    console.log(`[Pi Integration] Mode: ${this.mode}, SDK Available: ${this.sdkAvailable}`);
  }

  // -------------------------------------------------------------------------
  // SDK loading & initialization (official Pi SDK)
  // -------------------------------------------------------------------------
  async loadPiSdk() {
    // If the SDK is already present, resolve immediately
    if (window.Pi) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://sdk.minepi.com/pi-sdk.js';
      script.async = true;
      script.onload = () => {
        console.log('[Pi Integration] Pi SDK script loaded');
        resolve();
      };
      script.onerror = (e) => {
        console.warn('[Pi Integration] Failed to load Pi SDK script', e);
        reject(new Error('Failed to load Pi SDK'));
      };
      document.head.appendChild(script);
    });
  }

  async initPiSdk() {
    try {
      await this.loadPiSdk();
      // Initialise the SDK – sandbox mode for development / testnet
      await Pi.init({ version: '2.0', sandbox: true });
      this.sdkAvailable = true;
      console.log('[Pi Integration] Pi SDK initialised (sandbox)');
    } catch (e) {
      console.warn('[Pi Integration] Pi SDK not available or init failed', e);
      this.sdkAvailable = false;
    }
  }

  // -------------------------------------------------------------------------
  // Existing detection helpers (kept for backward‑compatibility)
  // -------------------------------------------------------------------------
  detectPiSdk() {
    if (typeof window === 'undefined') return false;
    const piSdkPresent = window.Pi && typeof window.Pi.authenticate === 'function' && typeof window.Pi.createPayment === 'function';
    console.log(`[Pi Integration] Pi SDK detected: ${piSdkPresent}`);
    return piSdkPresent;
  }

  detectMode() {
    // 1. Config frontend explicite si disponible
    if (typeof window !== "undefined" && window.ATLASPI_CONFIG && window.ATLASPI_CONFIG.APP_MODE) {
      return window.ATLASPI_CONFIG.APP_MODE;
    }

    // 2. Si Pi SDK est disponible dans le navigateur
    if (typeof window !== "undefined" && window.Pi) {
      return "pirc2-sandbox";
    }

    // 3. Fallback simple
    return "demo";
  }

  initConfig() {
    // Placeholder for loading configuration
    return {
      mode: this.mode,
      // ... other config properties
    };
  }

  /**
   * Set backend mode info (called after backend health check)
   */
  setBackendMode(mode) {
    this.mode = mode;
    this.config.mode = mode;
    // Assurer que piBrowserPayments est aussi informé si disponible
    if (window.piBrowserPayments) {
      // Re-detect SDK availability as it might depend on the environment Pi is running in
      window.piBrowserPayments.sdkAvailable = window.piBrowserPayments.detectPiSdk(); 
      console.log(`[Pi Integration] Updated backend mode to ${mode}. Pi SDK available for payments: ${window.piBrowserPayments.sdkAvailable}`);
    }
  }

  // -------------------------------------------------------------------------
  // Authentication (demo fallback + real Pi SDK)
  // -------------------------------------------------------------------------
  async authenticate() {
    console.log(`[Pi Auth] Starting authentication in mode: ${this.mode}`);

    // Ensure SDK is loaded & initialised
    if (!this.sdkAvailable) {
      console.log('[Pi Auth] Pi SDK unavailable, falling back to DEMO auth');
      return this.authDemo();
    }

    // SDK is available – use the official flow
    switch (this.mode) {
      case 'demo':
        console.log('[Pi Auth] Using DEMO authentication.');
        return this.authDemo();

      case 'pi-ready':
      case 'pirc2-sandbox':
        console.log('[Pi Auth] Attempting PI‑READY authentication (sandbox) using Pi SDK.');
        try {
          const result = await this.authPiSdk();
          if (result.ok) {
            return result;
          } else {
            console.warn('[Pi Auth] Pi SDK auth failed, falling back to DEMO.');
            const demoResult = await this.authDemo();
            return { ...demoResult, fallbackMode: 'pi-ready -> demo' };
          }
        } catch (e) {
          console.error('[Pi Auth] Unexpected error during Pi SDK auth', e);
          const demoResult = await this.authDemo();
          return { ...demoResult, fallbackMode: 'pi-ready -> demo (error)' };
        }

      case 'pirc2-production':
        console.log('[Pi Auth] Attempting PRODUCTION authentication using Pi SDK.');
        return this.authPiSdk();

      default:
        console.warn(`[Pi Auth] Unknown mode: ${this.mode}. Falling back to DEMO auth.`);
        return this.authDemo();
    }
  }

  // -------------------------------------------------------------------------
  // Demo authentication (unchanged)
  // -------------------------------------------------------------------------
  async authDemo() {
    console.log("[Pi Auth] Running DEMO authentication flow.");
    // Simulate a successful demo authentication
    return new Promise(resolve => {
      setTimeout(() => {
        this.user = { uid: 'demo-user-123', username: 'DemoUser', wallet_address: 'DUMMY_WALLET_123' };
        resolve({ ok: true, user: this.user, mode: 'demo' });
      }, 500);
    });
  }

  // -------------------------------------------------------------------------
  // Real Pi SDK authentication (official API)
  // -------------------------------------------------------------------------
  async authPiSdk() {
    console.log("[Pi Auth] Running Pi SDK authentication flow.");
    if (!this.sdkAvailable) {
      return { ok: false, error: "Pi SDK not available for authentication.", mode: this.mode };
    }
    try {
      const authResult = await Pi.authenticate(
        ['payments'], // request the payments scope (minimum required for createPayment)
        (payment) => {
          // onIncompletePaymentFound – simply log for now
          console.warn('[Pi Auth] Incomplete payment found', payment);
        }
      );
      // authResult follows the AuthResult shape defined in the docs
      this.user = authResult.user;
      return { ok: true, user: this.user, mode: this.mode };
    } catch (error) {
      console.error("[Pi Auth] Pi SDK authentication failed:", error);
      return { ok: false, error: error.message || "Pi SDK authentication error", mode: this.mode };
    }
  }

  // -------------------------------------------------------------------------
  // Getters / status helpers (unchanged)
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

  /**
   * Get status message for UI
   */
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

  /**
   * Get auth status object (for display in UI)
   */
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

// Exposer globalement
if (typeof window !== 'undefined') {
  window.piIntegrationManager = new PiIntegrationManager(); // Instancier globalement
}
