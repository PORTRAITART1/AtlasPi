/**
 * AtlasPi Frontend Auth Configuration
 *
 * This file defines the frontend authentication behavior for Pi SDK usage.
 * Authentication requires the Pi SDK in browser contexts where Pi auth is needed.
 */

const AtlasPiFrontendAuthConfig = {
  /**
   * Get current auth configuration.
   * Can be called after backend health check to sync configuration.
   */
  getConfig: function(backendMode) {
    const mode = backendMode || 'pirc2-production';

    switch (mode) {
      case 'pi-ready':
        return {
          mode: 'pi-ready',
          label: 'Pi-READY Mode',
          description: 'Ready for real Pi SDK authentication testing',
          authType: 'pi-ready',
          authLabel: 'Pi Authentication',
          piSdkRequired: true,
          features: {
            piAuth: true,
            piPayments: true
          },
          uiMessage: '🔵 Running in Pi-READY mode - Pi SDK authentication required'
        };

      case 'pirc2-sandbox':
        return {
          mode: 'pirc2-sandbox',
          label: 'SANDBOX Mode',
          description: 'Sandbox mode for real Pi SDK authentication testing',
          authType: 'pi-sandbox',
          authLabel: 'Pi Authentication (Sandbox)',
          piSdkRequired: true,
          features: {
            piAuth: true,
            piPayments: true
          },
          uiMessage: '🟡 Running in SANDBOX mode - Pi SDK authentication required'
        };

      case 'pirc2-production':
        return {
          mode: 'pirc2-production',
          label: 'PRODUCTION Mode',
          description: 'Production with real Pi SDK authentication and full validation',
          authType: 'pi-production',
          authLabel: 'Pi Authentication (Production)',
          piSdkRequired: true,
          features: {
            piAuth: true,
            piPayments: true
          },
          uiMessage: '🔴 Running in PRODUCTION mode - Pi SDK required'
        };

      default:
        return this.getConfig('pirc2-production');
    }
  },

  /**
   * Get auth button configuration.
   */
  getAuthButtonConfig: function(mode) {
    const config = this.getConfig(mode);
    const piAvailable = typeof window !== 'undefined' && !!window.Pi;

    return {
      label: config.authLabel,
      tooltip: config.description,
      disabled: config.piSdkRequired && !piAvailable,
      className: `btn-auth-${config.mode}`
    };
  },

  /**
   * Get auth status message.
   */
  getAuthStatusMessage: function(mode, sdkAvailable, isAuthenticated) {
    const config = this.getConfig(mode);

    if (isAuthenticated) {
      return `✅ Authenticated in ${config.label}`;
    }

    if (config.piSdkRequired && !sdkAvailable) {
      return `⚠️ Pi SDK required but not available in ${config.label}`;
    }

    return `🔄 Ready to authenticate in ${config.label}`;
  },

  /**
   * Validate auth configuration for current environment.
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

    return {
      valid: issues.length === 0,
      issues,
      config
    };
  }
};

if (typeof window !== 'undefined') {
  window.AtlasPiFrontendAuthConfig = AtlasPiFrontendAuthConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtlasPiFrontendAuthConfig;
}
