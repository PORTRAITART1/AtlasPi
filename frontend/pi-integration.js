// ... (début de la classe)

class PiIntegrationManager {
  constructor() {
    this.mode = this.detectMode();
    this.sdkAvailable = this.detectPiSdk();
    this.user = null;
    this.config = this.initConfig();
    
    console.log(`[Pi Integration] Mode: ${this.mode}, SDK Available: ${this.sdkAvailable}`);
  }

  // Placeholder for detectPiSdk, detectMode, initConfig - assuming they exist and work
  detectPiSdk() {
    if (typeof window === 'undefined') return false;
    // Check for the presence of the Pi SDK object and its core functions
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

  /**
   * Centralized authentication function
   * Routes to either demo or Pi-ready based on mode + SDK availability
   */
  async authenticate() {
    console.log(`[Pi Auth] Starting authentication in mode: ${this.mode}`);

    // If the Pi SDK is not available, we must fall back to demo authentication
    if (!this.sdkAvailable) {
      console.log('[Pi Auth] Pi SDK unavailable, falling back to DEMO auth');
      return this.authDemo();
    }

    // If the SDK is available, use the configured mode
    switch (this.mode) {
      case 'demo':
        console.log('[Pi Auth] Using DEMO authentication.');
        return this.authDemo();
      
      case 'pi-ready': // Sandbox
      case 'pirc2-sandbox':
        console.log('[Pi Auth] Attempting PI-READY authentication (sandbox mode) using Pi SDK.');
        // Attempt Pi authentication using the SDK
        const piAuthResult = await this.authPiSdk(); 
        if (piAuthResult.ok) {
          return piAuthResult;
        } else {
          // If Pi SDK authentication fails or is incomplete, fall back to demo
          console.warn('[Pi Auth] Pi SDK auth failed in pi-ready mode, falling back to DEMO.');
          const demoResult = await this.authDemo();
          // Indicate that a fallback occurred
          return { ...demoResult, fallbackMode: 'pi-ready -> demo' };
        }
      
      case 'pirc2-production':
        console.log('[Pi Auth] Attempting PRODUCTION authentication using Pi SDK.');
        // Production requires the real Pi SDK authentication to succeed
        return this.authPiSdk(); 
      
      default:
        console.warn(`[Pi Auth] Unknown mode: ${this.mode}. Falling back to DEMO auth.`);
        return this.authDemo();
    }
  }

  // Placeholder for authDemo - assumes it returns { ok: true, user: {...}, mode: 'demo' } or { ok: false, error: '...' }
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

  // Placeholder for authPiSdk - assumes it uses window.Pi.authenticate()
  async authPiSdk() {
    console.log("[Pi Auth] Running Pi SDK authentication flow.");
    if (!this.sdkAvailable) {
      return { ok: false, error: "Pi SDK not available for authentication.", mode: this.mode };
    }
    try {
      // This is where the actual Pi SDK authentication call would happen
      // Example: const authResult = await window.Pi.authenticate(...);
      // For now, simulate success for sandbox/production if SDK is available
      const simulatedAuthResult = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true, // Assume success for now
            user: { uid: 'pi-sdk-user-456', username: 'PiUser', wallet_address: 'PI_WALLET_ADDRESS_XYZ' },
            mode: this.mode // Reflects the current app mode (pi-ready or production)
          });
        }, 1000);
      });
      this.user = simulatedAuthResult.user;
      return simulatedAuthResult;
    } catch (error) {
      console.error("[Pi Auth] Pi SDK authentication failed:", error);
      return { ok: false, error: error.message || "Pi SDK authentication error", mode: this.mode };
    }
  }

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
        return '✅ Pi-READY mode - Ready for Pi SDK authentication (sandbox)';
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
