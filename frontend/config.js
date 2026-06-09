/**
 * AtlasPi Frontend Configuration - MAINNET
 */

const determineApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.ATLASPI_CONFIG && window.ATLASPI_CONFIG.API_BASE_URL) {
    return window.ATLASPI_CONFIG.API_BASE_URL;
  }

  try {
    const stored = localStorage.getItem('atlaspi_api_base_url');
    if (stored) return stored;
  } catch (e) {}

  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000`;
    }

    // Render production
    if (hostname.includes('onrender.com') || hostname.includes('atlaspi')) {
      return 'https://atlaspi.onrender.com';
    }

    return `${protocol}//${hostname}`;
  }

  return 'https://atlaspi.onrender.com';
};

const ATLASPI_CONFIG = {
  API_BASE_URL: determineApiBaseUrl(),

  // App metadata
  APP_NAME: 'AtlasPi',
  APP_VERSION: '1.0.0',

  // Mode mainnet
  APP_MODE: 'pirc2-production',
  PI_NETWORK: 'mainnet',
  PI_SANDBOX: false,

  // Feature flags - MAINNET
  FEATURES: {
    DEMO_AUTH: false,
    DEMO_PAYMENTS: false,
    ADMIN_MODERATION: true,
  },

  // API endpoints
  ENDPOINTS: {
    AUTH_PI: '/api/auth/pi',
    PAYMENTS_CREATE: '/api/payments/create-record',
    PAYMENTS_APPROVE: '/api/payments/approve',
    PAYMENTS_COMPLETE: '/api/payments/complete',
    PAYMENTS_LIST: '/api/payments/list',
    MERCHANT_CREATE: '/api/merchant-listings/create',
    MERCHANT_SEARCH: '/api/merchant-listings/search',
    MERCHANT_DETAIL: '/api/merchant-listings/detail',
    MERCHANT_UPDATE: '/api/merchant-listings/update',
    MERCHANT_LIST: '/api/merchant-listings/list',
    MERCHANT_PENDING: '/api/merchant-listings/pending',
    MERCHANT_MODERATE: '/api/merchant-listings/moderate',
    MERCHANT_HISTORY: '/api/merchant-listings/moderation-history',
    HEALTH: '/api/health',
  },

  getEndpoint: function(key) {
    if (!this.ENDPOINTS[key]) {
      console.warn(`Unknown endpoint key: ${key}`);
      return null;
    }
    return this.API_BASE_URL + this.ENDPOINTS[key];
  },

  setApiBaseUrl: function(url) {
    this.API_BASE_URL = url;
    localStorage.setItem('atlaspi_api_base_url', url);
    console.log(`API Base URL updated to: ${url}`);
  },

  resetApiBaseUrl: function() {
    localStorage.removeItem('atlaspi_api_base_url');
    this.API_BASE_URL = determineApiBaseUrl();
    console.log(`API Base URL reset to: ${this.API_BASE_URL}`);
  },
};

if (typeof window !== 'undefined') {
  window.ATLASPI_CONFIG = ATLASPI_CONFIG;
  console.log('[AtlasPi] Config loaded — mode:', ATLASPI_CONFIG.APP_MODE, '| network:', ATLASPI_CONFIG.PI_NETWORK);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ATLASPI_CONFIG;
}
