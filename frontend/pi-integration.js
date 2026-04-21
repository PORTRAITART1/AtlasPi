/**
 * AtlasPi Pi SDK Integration Module (DAY 2 / Pi Integration Setup)
 * 
 * This module handles:
 * - Detection of Pi SDK availability
 * - Mode switching: demo / pi-ready (sandbox) / pirc2-production
 * - Fallback to demo if SDK unavailable
 * - Centralized auth function (demo vs Pi-ready)
 * - Safe payload validation
 * 
 * IMPORTANT: This is Pi-READY structure, not full Pi integration yet.
 * Full Pi SDK integration happens in DAY 3.
 */

class PiIntegrationManager {
  constructor() {
    this.mode = this.detectMode();
    this.sdkAvailable = this.detectPiSdk();
    this.user = null;
    this.config = this.initConfig();
    
    console.log(`[Pi Integration] Mode: ${this.mode}, SDK Available: ${this.sdkAvailable}`);
  }

  /**
   * Detect Pi SDK availability in window
   */
  detectPiSdk() {
    // Check if window.Pi exists (Pi SDK loaded)
    if (typeof window !== 'undefined' && window.Pi) {
      console.log('[Pi Integration] Pi SDK detected');
      return true;
    }

    console.log('[Pi Integration] Pi SDK NOT detected - using demo fallback');
    return false;
  }

  /**
   * Detect running mode from backend configuration or environment hints
   */
  detectMode() {
    // Check if backend exposed mode info (from endpoint GET /)
    if (window.__atlaspiBundledMode) {
      return window.__atlaspiBundledMode;
    }

    // Default to 'demo'
    return 'demo';
  }

  /**
   * Initialize Pi integration configuration
   */
  initConfig() {
    return {
      // Modes: 'demo', 'pi-ready' (sandbox), 'pirc2-production'
      mode: this.mode,
      sdkAvailable: this.sdkAvailable,
      
      // Pi SDK configuration (placeholders for DAY 2)
      piSdkAppId: null, // Will be set from backend
      piSdkAppName: 'AtlasPi',
      
      // API endpoints
      apiAuthPi: window.ATLASPI_CONFIG?.getEndpoint('AUTH_PI') || '/api/auth/pi',
      
      // Fallback configuration
      demoUser: {
        uid: 'test-user-001',
        username: 'demo_pioneer',
        accessToken: 'demo-access-token-123',
        wallet_address: 'demo-wallet-not-connected'
      }
    };
  }

  /**
   * Set backend mode info (called after backend health check)
   */
  setBackendMode(mode) {
    this.mode = mode;
    this.config.mode = mode;
  }

  /**
   * Centralized authentication function
   * Routes to either demo or Pi-ready based on mode + SDK availability
   */
  async authenticate() {
    console.log(`[Pi Auth] Starting authentication in mode: ${this.mode}`);

    // If SDK not available, fallback to demo
    if (!this.sdkAvailable) {
      console.log('[Pi Auth] Pi SDK unavailable, falling back to DEMO auth');
      return this.authDemo();
    }

    // If SDK available, attempt Pi authentication based on mode
    switch (this.mode) {
      case 'demo':
        // Even if SDK is available, stay in demo mode
        return this.authDemo();
      
      case 'pi-ready':
      case 'pirc2-sandbox':
        // Pi-ready: try real Pi auth, fallback if incomplete
        return this.authPiReady();
      
      case 'pirc2-production':
        // Production: require real Pi auth
        return this.authPiProduction();
      
      default:
        return this.authDemo();
    }
  }

  /**
   * Demo authentication - uses mock user
   */
  async authDemo() {
    console.log('[Pi Auth] Using DEMO authentication (mock user)');
    
    const demoUser = this.config.demoUser;
    
    try {
      const response = await fetch(this.config.apiAuthPi, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: demoUser.uid,
          username: demoUser.username,
          accessToken: demoUser.accessToken,
          wallet_address: demoUser.wallet_address,
          // Add metadata to indicate this is demo
          _metadata: {
            source: 'demo-auth',
            isDemo: true,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await response.json();

      if (data.ok) {
        this.user = {
          ...demoUser,
          isDemo: true,
          source: 'demo-auth'
        };
        console.log('[Pi Auth] DEMO auth success:', { uid: this.user.uid, username: this.user.username });
        return { ok: true, user: this.user, mode: 'demo', isDemo: true };
      } else {
        console.error('[Pi Auth] Demo auth failed:', data.error);
        return { ok: false, error: data.error, mode: 'demo' };
      }
    } catch (error) {
      console.error('[Pi Auth] Demo auth error:', error.message);
      return { ok: false, error: error.message, mode: 'demo' };
    }
  }

  /**
   * Pi-Ready authentication (sandbox testing structure)
   * Attempts real Pi auth if SDK available, falls back to demo if incomplete
   */
  async authPiReady() {
    console.log('[Pi Auth] Attempting PI-READY authentication (sandbox mode)');

    // If SDK available, attempt Pi payment SDK auth
    if (this.sdkAvailable && window.Pi) {
      return this.authPiSdk();
    }

    // Fallback to demo if SDK unavailable
    console.log('[Pi Auth] Pi SDK not available, falling back to demo in pi-ready mode');
    const result = await this.authDemo();
    return { ...result, fallbackMode: 'pi-ready -> demo' };
  }

  /**
   * Production authentication (requires real Pi SDK + valid credentials)
   */
  async authPiProduction() {
    console.log('[Pi Auth] Attempting PRODUCTION authentication');

    // In production, Pi SDK MUST be available
    if (!this.sdkAvailable || !window.Pi) {
      console.error('[Pi Auth] PRODUCTION mode requires Pi SDK, but SDK not available');
      return {
        ok: false,
        error: 'Pi SDK required for production mode',
        mode: 'pirc2-production'
      };
    }

    // Attempt Pi SDK auth
    return this.authPiSdk();
  }

  /**
   * Real Pi SDK authentication (DAY 2+ structure)
   * Placeholder for actual Pi Payment SDK integration
   */
  async authPiSdk() {
    console.log('[Pi Auth] Attempting Pi SDK authentication (DAY 2+ placeholder)');

    // This is a placeholder for DAY 2/3 implementation
    // When Pi SDK is fully integrated, this will:
    // 1. Call window.Pi.authenticate()
    // 2. Get accessToken from Pi
    // 3. Validate on backend
    // 4. Return authenticated user

    console.warn('[Pi Auth] Pi SDK auth not yet implemented (DAY 2+ task)');
    
    return {
      ok: false,
      error: 'Pi SDK integration not yet implemented (DAY 2+)',
      mode: this.mode,
      placeholder: true
    };
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Get current auth mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Check if using demo auth
   */
  isDemoMode() {
    return this.mode === 'demo';
  }

  /**
   * Check if Pi SDK available
   */
  isPiSdkAvailable() {
    return this.sdkAvailable;
  }

  /**
   * Get status message for UI
   */
  getStatusMessage() {
    if (!this.sdkAvailable) {
      return 'Pi SDK not available - using DEMO mode fallback';
    }

    switch (this.mode) {
      case 'demo':
        return 'DEMO mode - Mock authentication (for testing)';
      case 'pi-ready':
      case 'pirc2-sandbox':
        return 'Pi-READY mode - Will use real Pi SDK when available (DAY 2+)';
      case 'pirc2-production':
        return 'PRODUCTION mode - Requires real Pi SDK and credentials';
      default:
        return 'Unknown mode';
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

// Export as global or module
if (typeof window !== 'undefined') {
  window.PiIntegrationManager = PiIntegrationManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PiIntegrationManager;
}
