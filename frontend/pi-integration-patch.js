/**
 * Pi Integration Patch - AtlasPi
 * Patches piConnectBtn to use centralized auth handler
 */

(function() {
  if (typeof PiIntegrationManager === 'undefined' || typeof AtlasPiAuthHandler === 'undefined') {
    console.error('[Pi Integration] PiIntegrationManager or AtlasPiAuthHandler not loaded');
    return;
  }

  const patchConnectBtn = () => {
    const piConnectBtn = document.getElementById('piConnectBtn');
    const piStatus     = document.getElementById('piStatus');
    const piUsername   = document.getElementById('piUsername');
    const piWallet     = document.getElementById('piWallet');

    if (!piConnectBtn) {
      console.warn('[Pi Integration] piConnectBtn not found — skipping patch');
      return;
    }

    // Use the globally defined authHandler from script.js
    const handler = window._atlasAuthHandler || null;

    piConnectBtn.addEventListener('click', async function() {
      if (!piStatus) return;
      piStatus.textContent = '⏳ Connecting...';

      try {
        const authHandler = handler || window._atlasAuthHandler;
        if (!authHandler) {
          console.error('[Pi Integration] authHandler not available');
          return;
        }

        await authHandler.handleAuthButtonClick(
          (result) => {
            // Success — updatePiAuthUI is called inside script.js via event
            console.log('[Pi Integration] Auth success:', result);
          },
          (error) => {
            if (piStatus) {
              piStatus.textContent = '❌ Auth error: ' + (error?.error || 'Unknown');
            }
          }
        );
      } catch (err) {
        if (piStatus) piStatus.textContent = '❌ Failed to authenticate.';
        console.error('[Pi Integration] Error:', err);
      }
    });

    console.log('[Pi Integration] piConnectBtn patched successfully');
  };

  // Wait for DOM + script.js to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchConnectBtn);
  } else {
    setTimeout(patchConnectBtn, 100);
  }

  window.getPiManagerStatus = () => {
    return window.piIntegrationManager?.getAuthStatus() || { error: 'Not initialized' };
  };

  console.log('[Pi Integration] Patch loaded');
})();
