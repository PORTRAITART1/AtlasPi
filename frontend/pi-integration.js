// ... (début de la classe)

class PiIntegrationManager {
  constructor() {
    this.mode = this.detectMode();
    this.sdkAvailable = this.detectPiSdk();
    this.user = null;
    this.config = this.initConfig();
    
    console.log(`[Pi Integration] Mode: ${this.mode}, SDK Available: ${this.sdkAvailable}`);
  }

  // ... (detectPiSdk, detectMode, initConfig)

  /**
   * Set backend mode info (called after backend health check)
   */
  setBackendMode(mode) {
    this.mode = mode;
    this.config.mode = mode;
    // Assurer que piBrowserPayments est aussi informé si disponible
    if (window.piBrowserPayments) {
      window.piBrowserPayments.sdkAvailable = window.piBrowserPayments.detectPiSdk(); // Re-détecter si besoin
      // Le mode de piBrowserPayments est dérivé de celui-ci
    }
  }

  /**
   * Centralized authentication function
   * Routes to either demo or Pi-ready based on mode + SDK availability
   */
  async authenticate() {
    console.log(`[Pi Auth] Starting authentication in mode: ${this.mode}`);

    // Si le SDK Pi n'est pas disponible, on reste en démo
    if (!this.sdkAvailable) {
      console.log('[Pi Auth] Pi SDK unavailable, falling back to DEMO auth');
      return this.authDemo();
    }

    // Si le SDK est disponible, on utilise le mode configuré
    switch (this.mode) {
      case 'demo':
        return this.authDemo();
      
      case 'pi-ready': // Sandbox
      case 'pirc2-sandbox':
        // Tenter une authentification Pi réelle (si SDK dispo)
        // Si l'authentification Pi échoue ou n'est pas complète, fallback vers démo
        console.log('[Pi Auth] Attempting PI-READY authentication (sandbox mode)');
        const piAuthResult = await this.authPiSdk(); // Tente le vrai flow
        if (piAuthResult.ok) {
          return piAuthResult;
        } else {
          console.warn('[Pi Auth] Pi SDK auth failed in pi-ready mode, falling back to DEMO');
          const demoResult = await this.authDemo();
          return { ...demoResult, fallbackMode: 'pi-ready -> demo' };
        }
      
      case 'pirc2-production':
        // Production: nécessite le vrai SDK Pi
        console.log('[Pi Auth] Attempting PRODUCTION authentication');
        return this.authPiSdk(); // Doit réussir
      
      default:
        return this.authDemo();
    }
  }

  // ... (authDemo, authPiSdk, getUser, getMode, isDemoMode, isPiSdkAvailable)

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
