/**
 * AtlasPi Frontend Auth Configuration (DAY 2 / Pi Integration Setup)
 * 
 * This configuration file defines the authentication mode and behavior
 * for the frontend based on the running environment.
 * 
 * Modes:
 * - demo: Development/testing with mock authentication
 * - pi-ready (pirc2-sandbox): Ready for real Pi SDK, fallback to demo if unavailable
 * - pirc2-production: Requires real Pi SDK and production credentials
 */

const AtlasPiFrontendAuthConfig = {
  /**
   * Get current auth configuration
   * Can be called after backend health check to sync configuration
   */
  getConfig: function(backendMode) {
    const mode = backendMode || 'demo';

    switch (mode) {
      case 'demo':
        return {
          mode: 'demo',
          label: 'DEMO Mode',
          description: 'Development/testing mode with mock authentication',
          authType: 'demo',
          authLabel: 'Demo Authentication',
          fallback: 'none', // Already at fallback
          piSdkRequired: false,
          features: {
            demoAuth: true,
            piAuth: false,
            piPayments: false
          },
          uiMessage: '🟢 Running in DEMO mode with mock authentication'
        };

      case 'pi-ready':
      case 'pirc2-sandbox':
        return {
          mode: 'pi-ready',
          label: 'Pi-READY Mode (Sandbox)',
          description: 'Ready for real Pi SDK testing with fallback to demo',
          authType: 'pi-ready',
          authLabel: 'Pi Authentication (Sandbox Testing)',
          fallback: 'demo',
          piSdkRequired: false, // Will fallback to demo if SDK unavailable
          features: {
            demoAuth: true,
            piAuth: true, // Structure ready, but fallback supported
            piPayments: false // DAY 3+
          },
          uiMessage: '🔵 Running in Pi-READY mode (SDK optional for testing)'
        };

      case 'pirc2-production':
        return {
          mode: 'pirc2-production',
          label: 'PRODUCTION Mode',
          description: 'Production with real Pi SDK and full validation',
          authType: 'pi-production',
          authLabel: 'Pi Authentication (Production)',
          fallback: 'none', // No fallback in production
          piSdkRequired: true,
          features: {
            demoAuth: false,
            piAuth: true, // Required
            piPayments: true // Required
          },
          uiMessage: '🔴 Running in PRODUCTION mode - Pi SDK required'
        };

      default:
        return this.getConfig('demo');
    }
  },

  /**
   * Get auth button configuration
   */
  getAuthButtonConfig: function(mode) {
    const config = this.getConfig(mode);

    return {
      label: config.authLabel,
      tooltip: config.description,
      disabled: config.piSdkRequired && !window.Pi,
      className: `btn-auth-${config.mode}`
    };
  },

  /**
   * Get auth status message
   */
  getAuthStatusMessage: function(mode, sdkAvailable, isAuthenticated) {
    const config = this.getConfig(mode);

    if (isAuthenticated) {
      return `✅ Authenticated in ${config.label}`;
    }

    if (config.piSdkRequired && !sdkAvailable) {
      return `⚠️ Pi SDK required but not available in ${config.label}`;
    }

    if (!sdkAvailable && config.fallback === 'demo') {
      return `ℹ️ Pi SDK not available, using demo fallback in ${config.label}`;
    }

    return `🔄 Ready to authenticate in ${config.label}`;
  },

  /**
   * Validate auth configuration for current environment
   */
  validate: function(mode, sdkAvailable) {
    const config = this.getConfig(mode);

    const issues = [];

    if (config.piSdkRequired && !sdkAvailable) {
      issues.push({
        severity: 'error',
        message: `Pi SDK required in ${config.label} but not available`
      });
    }

    if (mode === 'pirc2-production' && !sdkAvailable) {
      issues.push({
        severity: 'error',
        message: 'Production mode requires Pi SDK to be loaded'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues: issues
    };
  }
};

// Export
if (typeof window !== 'undefined') {
  window.AtlasPiFrontendAuthConfig = AtlasPiFrontendAuthConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtlasPiFrontendAuthConfig;
}
