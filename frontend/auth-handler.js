/**
 * AtlasPi Auth Integration (DAY 2 / Pi Integration Setup)
 * 
 * Centralized authentication handler that:
 * - Integrates with PiIntegrationManager
 * - Routes to demo or Pi-ready auth
 * - Maintains backward compatibility with existing demo flows
 * - Provides clear fallback messaging
 */

class AtlasPiAuthHandler {
  constructor(piManager) {
    this.piManager = piManager;
    this.authResult = null;
  }

  /**
   * Handle auth button click - central entry point
   */
  async handleAuthButtonClick(onSuccess, onError) {
    console.log('[Auth] Auth button clicked');

    try {
      // Call centralized Pi manager authentication
      const result = await this.piManager.authenticate();

      if (result.ok) {
        this.authResult = result;
        console.log('[Auth] Authentication successful:', result);
        
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } else {
        console.error('[Auth] Authentication failed:', result.error);
        
        if (onError) {
          onError(result);
        }
        return result;
      }
    } catch (error) {
      console.error('[Auth] Authentication error:', error);
      
      if (onError) {
        onError({ ok: false, error: error.message });
      }
      return { ok: false, error: error.message };
    }
  }

  /**
   * Get auth result
   */
  getAuthResult() {
    return this.authResult;
  }

  /**
   * Get authenticated user
   */
  getUser() {
    return this.piManager.getUser();
  }

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return this.authResult?.ok === true;
  }

  /**
   * Get auth status for UI display
   */
  getAuthStatus() {
    return this.piManager.getAuthStatus();
  }

  /**
   * Get auth mode label for UI
   */
  getAuthModeLabel() {
    const status = this.getAuthStatus();
    
    if (status.isDemoMode) {
      return '🟢 DEMO Auth (Testing Mode)';
    } else if (status.sdkAvailable) {
      return '🔐 Pi Auth (Real SDK)';
    } else {
      return '⚠️ Demo Auth (SDK Unavailable)';
    }
  }

  /**
   * Get auth button label
   */
  getAuthButtonLabel() {
    if (this.isAuthenticated()) {
      const user = this.getUser();
      return `✓ Connected: ${user?.username || 'User'}`;
    }

    const status = this.getAuthStatus();
    if (status.isDemoMode) {
      return 'Connect with Pi (DEMO)';
    } else {
      return 'Connect with Pi';
    }
  }
}

// Export
if (typeof window !== 'undefined') {
  window.AtlasPiAuthHandler = AtlasPiAuthHandler;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtlasPiAuthHandler;
}
