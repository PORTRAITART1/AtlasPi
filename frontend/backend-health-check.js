/**
 * Backend Health Check and Status Display
 * Checks if the backend API is reachable and updates the UI
 */

(function() {
  'use strict';

  // Wait for DOM to be ready and config to be loaded
  function initBackendHealthCheck() {
    const apiStatusElement = document.getElementById('apiStatus');
    if (!apiStatusElement) {
      console.warn('[Health Check] API status element not found');
      return;
    }

    // Get the API base URL from config
    const apiBaseUrl = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000';
    const healthCheckUrl = `${apiBaseUrl}/api/health`;

    console.log('[Health Check] Checking backend at:', healthCheckUrl);

    // Perform health check
    fetch(healthCheckUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      timeout: 5000
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[Health Check] Backend is healthy:', data);
        apiStatusElement.textContent = '✅ Backend Connected and Healthy';
        apiStatusElement.style.color = '#10b981';
      })
      .catch(error => {
        console.error('[Health Check] Backend check failed:', error);
        apiStatusElement.textContent = `❌ Backend Unreachable (${apiBaseUrl})`;
        apiStatusElement.style.color = '#ef4444';
      });
  }

  // Run health check when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackendHealthCheck);
  } else {
    initBackendHealthCheck();
  }

  // Also expose a manual health check function
  window.checkBackendHealth = function() {
    console.log('[Manual Check] Running backend health check...');
    initBackendHealthCheck();
  };
})();
