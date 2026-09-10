/**
 * pi-auth.js - Pi authentication handler for AtlasPi
 */

(function() {
  'use strict';

  function initPiAuth() {
    if (!window.Pi || typeof window.Pi.authenticate !== 'function') {
      console.warn('[Pi Auth] Pi SDK not available');
      return;
    }
    console.log('[Pi Auth] Ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPiAuth);
  } else {
    initPiAuth();
  }
})();
