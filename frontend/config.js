/**
 * AtlasPi Frontend Configuration
 * 
 * This file provides dynamic configuration for the frontend.
 * It can be injected at runtime or loaded as needed.
 */

// Determine API_BASE_URL from environment
// Priority: 1) window.ATLASPI_CONFIG 2) localStorage 3) current origin 4) fallback
const determineApiBaseUrl = () => {
  // 1. Check if already set globally (e.g., via HTML script injection)
  if (typeof window !== 'undefined' && window.ATLASPI_CONFIG && window.ATLASPI_CONFIG.API_BASE_URL) {
    return window.ATLASPI_CONFIG.API_BASE_URL;
  }

  // 2. Check localStorage (user can override)
  try {
    const stored = localStorage.getItem('atlaspi_api_base_url');
    if (stored) {
      return stored;
    }
  } catch (e) {
    // localStorage might be disabled
  }

  // 3. If running in Docker or same-origin environment
  // Default: assume backend is on same host + different port or same host
  // For Docker: frontend:8080 → backend:3000 (both localhost)
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // In Docker localhost environment
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//localhost:3000`;
    }

    // Render production setup for AtlasPi
    if (hostname === 'atlaspi-frontend.onrender.com') {
      return 'https://atlaspi-backend.onrender.com';
    }

    // In production, assume backend is on /api relative path
    if (window.location.port === '8080' || window.location.port === '80' || window.location.port === '443') {
      return `${protocol}//${hostname}:3000`;
    }

    // For same-origin setup, use /api as relative path
    return `${protocol}//${hostname}/api`;
  }

  // 4. Fallback (should not reach here in normal circumstances)
  return 'http://localhost:3000';
};

// Main config object
const ATLASPI_CONFIG = {
  // API Base URL - dynamically determined or configurable
  API_BASE_URL: determineApiBaseUrl(),

  // Application metadata
  APP_NAME: 'AtlasPi',
  APP_VERSION: '1.0.0',

  // Feature flags
  FEATURES: {
    DEMO_AUTH: true,        // Enable demo authentication
    DEMO_PAYMENTS: true,    // Enable demo payments
    ADMIN_MODERATION: true, // Enable admin moderation
  },

  // API endpoints (relative to API_BASE_URL)
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

  // Helper function to get full endpoint URL
  getEndpoint: function(key) {
    if (!this.ENDPOINTS[key]) {
      console.warn(`Unknown endpoint key: ${key}`);
      return null;
    }
    return this.API_BASE_URL + this.ENDPOINTS[key];
  },

  // Helper function to set API base URL at runtime (useful for production)
  setApiBaseUrl: function(url) {
    this.API_BASE_URL = url;
    localStorage.setItem('atlaspi_api_base_url', url);
    console.log(`API Base URL updated to: ${url}`);
  },

  // Reset to default
  resetApiBaseUrl: function() {
    localStorage.removeItem('atlaspi_api_base_url');
    this.API_BASE_URL = determineApiBaseUrl();
    console.log(`API Base URL reset to: ${this.API_BASE_URL}`);
  },
};

// Make config globally available
if (typeof window !== 'undefined') {
  window.ATLASPI_CONFIG = ATLASPI_CONFIG;
}

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ATLASPI_CONFIG;
}
