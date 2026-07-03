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

      piStatus.textContent = '✅ Connected with your Pi account.';

piStatus.style.color = '#10b981';
piStatus.style.fontWeight = '600';

const user = authHandler.getUser();
if (piUsername) piUsername.textContent = user?.username || '-';
if (piWallet) {
  piWallet.textContent =
    user?.wallet_address
      ? user.wallet_address
      : 'Wallet connected';
}

const pioneerUsername = document.getElementById("pioneerUsername");
const pioneerWallet = document.getElementById("pioneerWallet");

if (pioneerUsername) {
  pioneerUsername.textContent = user?.username ? `@${user.username}` : '-';
}

if (pioneerWallet) {
  pioneerWallet.textContent =
    user?.wallet_address
      ? user.wallet_address
      : 'Wallet connected';
}

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
