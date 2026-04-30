/**
 * Error Logger - Displays JavaScript errors directly on the page
 */

(function() {
  'use strict';

  // Create error display element
  const errorDiv = document.createElement('div');
  errorDiv.id = 'js-error-log';
  errorDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    max-width: 300px;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(0,0,0,0.9);
    color: #ff6b6b;
    padding: 10px;
    border-radius: 6px;
    font-size: 11px;
    font-family: monospace;
    z-index: 99999;
    display: none;
    border: 1px solid #ff6b6b;
  `;
  document.body.appendChild(errorDiv);

  // Catch all errors
  window.addEventListener('error', (event) => {
    console.error('[JS Error]', event.error);
    errorDiv.style.display = 'block';
    errorDiv.innerHTML += `<p>❌ ${event.error?.message || 'Unknown error'}</p>`;
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise]', event.reason);
    errorDiv.style.display = 'block';
    errorDiv.innerHTML += `<p>❌ Promise: ${event.reason?.message || event.reason}</p>`;
  });

  // Log script loading
  console.log('[Init] Error logger active. Check for red box in bottom-left.');
  
  // Log when key functions are available
  setTimeout(() => {
    console.log('[Check] window.piBrowserPayments:', !!window.piBrowserPayments);
    console.log('[Check] window.ATLASPI_CONFIG:', !!window.ATLASPI_CONFIG);
    console.log('[Check] API_BASE_URL:', window.ATLASPI_CONFIG?.API_BASE_URL);
    console.log('[Check] createPaymentBtn:', !!document.getElementById('createPaymentBtn'));
  }, 2000);
})();
