// ... (existing code)

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const piStatus = document.getElementById("piStatus");
  const piConnectBtn = document.getElementById("piConnectBtn");
  const piUsername = document.getElementById("piUsername");
  const piWallet = document.getElementById("piWallet");
  const createPaymentBtn = document.getElementById("createPaymentBtn");
  const payAmount = document.getElementById("payAmount");
  const payMemo = document.getElementById("payMemo");
  const paymentStatusElement = document.getElementById("paymentStatus"); // Added for payment status display

  // --- Global Variables ---
  // Assuming API_BASE_URL is globally available or loaded from config
  const API_BASE_URL = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000';
  let currentUser = null;
  let currentPayment = { localPaymentId: null, paymentId: null, txid: null }; // State for demo payment flow
  let editingMerchantId = null;

  // --- Initialization ---
  // piIntegrationManager and piBrowserPayments are initialized globally in their respective files
  const piManager = window.piIntegrationManager;
  
  if (createPaymentBtn) {
    createPaymentBtn.addEventListener('click', async () => {
    try {
      const amount = payAmount ? payAmount.value : '';
      const memo = payMemo ? payMemo.value : '';
      const piPaymentHandler = window.piBrowserPayments;

      if (!piPaymentHandler) {
        if (paymentStatusElement) {
          paymentStatusElement.textContent = '❌ Pi payment handler not ready.';
        }
        return;
      }

      if (!amount || Number(amount) <= 0) {
        if (paymentStatusElement) {
          paymentStatusElement.textContent = '❌ Please enter a valid amount.';
        }
        return;
      }

      if (paymentStatusElement) {
        paymentStatusElement.textContent = '⏳ Starting Pi payment...';
      }

      const result = await piPaymentHandler.initiatePayment({
        amount: Number(amount),
        memo: memo || 'AtlasPi payment'
      });

      if (paymentStatusElement) {
        paymentStatusElement.textContent =
          result?.message || '✅ Payment flow started.';
      }
    } catch (error) {
      if (paymentStatusElement) {
        paymentStatusElement.textContent = `❌ ${error.message || 'Payment failed.'}`;
      }
    }
  });
}

  // Initialise the Pi SDK (load script + Pi.init) – non‑blocking, fallback to demo if it fails
  piManager.initPiSdk().catch(() => {
    console.warn('Pi SDK could not be loaded – demo fallback will be used');
  });

  // Auth handler uses the global piManager
  const authHandler = new AtlasPiAuthHandler(piManager);

  // -------------------------------------------------
  // MENU HAMBURGER LOGIC (minimal, non‑intrusive)
  // -------------------------------------------------
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');

if (menuToggle && menuPanel) {
  const closeMenu = () => {
    menuPanel.classList.remove("open"); menuPanel.setAttribute("hidden", "");
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    menuPanel.classList.add("open"); menuPanel.removeAttribute("hidden");
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  menuToggle.addEventListener('click', () => {
    if (menuPanel.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  const menuLinks = menuPanel.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });
}

  // -------------------------------------------------
  // ... (rest of the file unchanged)
});

// Backend Status Check
document.addEventListener('DOMContentLoaded', () => {
  const apiStatusEl = document.getElementById('apiStatus');
  
  if (apiStatusEl) {
    const API_BASE_URL = window.ATLASPI_CONFIG?.API_BASE_URL || 
                         'https://atlaspi-backend.onrender.com';
    
    fetch(API_BASE_URL)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.status === 'running') {
          apiStatusEl.textContent = `✅ Backend connected (${data.mode} mode)`;
          apiStatusEl.style.color = '#10b981';
        } else {
          apiStatusEl.textContent = '⚠️ Backend responded but status unclear';
          apiStatusEl.style.color = '#f59e0b';
        }
      })
      .catch(err => {
        apiStatusEl.textContent = '❌ Backend connection failed';
        apiStatusEl.style.color = '#ef4444';
        console.error('Backend check error:', err);
      });
  }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const menuPanel = document.getElementById('menuPanel');
  const menuToggle = document.getElementById('menuToggle');
  
  if (menuPanel && menuToggle) {
    const isClickInsideMenu = menuPanel.contains(e.target);
    const isClickOnToggle = menuToggle.contains(e.target);
    
    if (!isClickInsideMenu && !isClickOnToggle && menuPanel.classList.contains('open')) {
      menuPanel.classList.remove('open');
      menuPanel.setAttribute('hidden', '');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  }
});
