/**
 * Script Integration for Pi Auth (DAY 2 / Pi Integration Setup)
 * 
 * This file patches the existing script.js to use the new Pi Integration Manager
 * while maintaining backward compatibility with demo flows.
 */

(function() {
  // Ensure PiIntegrationManager is available
  if (typeof PiIntegrationManager === 'undefined' || typeof AtlasPiAuthHandler === 'undefined') {
    console.error('[Pi Integration] PiIntegrationManager or AtlasPiAuthHandler not loaded');
    return;
  }

  // Store original functions
  const originalScriptInit = window._scriptInit;

  // Override connectDemoPiUser after DOM is ready
  const patchConnectDemoPiUser = () => {
    const piConnectBtn = document.getElementById('piConnectBtn');
    const piStatus = document.getElementById('piStatus');
    const piUsername = document.getElementById('piUsername');
    const piWallet = document.getElementById('piWallet');

    if (!piConnectBtn) {
      console.error('[Pi Integration] piConnectBtn not found in DOM');
      return;
    }

    // Replace button click handler with integrated auth handler
    piConnectBtn.removeEventListener('click', window._originalConnectHandler);
    
    piConnectBtn.addEventListener('click', async function() {
      if (!piStatus) return;

      piStatus.textContent = "⏳ Authenticating with Pi...";

      try {
        // Create fresh Pi manager for this auth attempt
        const piManager = window._piManager || new PiIntegrationManager();
        window._piManager = piManager;
        
        const authHandler = new AtlasPiAuthHandler(piManager);

        // Use centralized auth handler
        const result = await authHandler.handleAuthButtonClick(
          (authResult) => {
            // Success callback
            piStatus.textContent = `✅ ${authHandler.getAuthModeLabel()}: Connected and saved in backend.`;

            const user = authHandler.getUser();
            if (piUsername) piUsername.textContent = user?.username || '-';
            if (piWallet) piWallet.textContent = user?.wallet_address || '-';

            // Update button label
            if (piConnectBtn) {
              piConnectBtn.textContent = authHandler.getAuthButtonLabel();
              piConnectBtn.disabled = true;
            }
          },
          (error) => {
            // Error callback
            piStatus.textContent = `❌ Auth error: ${error.error || 'Unknown error'}`;
          }
        );
      } catch (error) {
        piStatus.textContent = "❌ Failed to authenticate.";
        console.error('[Pi Integration Auth] Error:', error);
      }
    });

    console.log('[Pi Integration] connectDemoPiUser patched with centralized auth handler');
  };

  // Apply patch when script.js has loaded
  setTimeout(() => {
    patchConnectDemoPiUser();
  }, 500);

  // Expose Pi manager globally for debugging
  window.getPiManagerStatus = () => {
    if (window._piManager) {
      return window._piManager.getAuthStatus();
    }
    return { error: 'Pi Manager not yet initialized' };
  };

  console.log('[Pi Integration] Script integration patch loaded');
})();
