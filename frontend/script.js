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
  const piPaymentHandler = window.piBrowserPayments; // Use the new payment handler

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
