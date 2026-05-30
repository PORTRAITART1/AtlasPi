// ... (existing code)

document.addEventListener("DOMContentLoaded", () => {
  const piBrowserOnlyNotice = document.getElementById("piBrowserOnlyNotice");
  const isPiBrowser = typeof window !== "undefined" && !!window.Pi;

  if (piBrowserOnlyNotice) {
    piBrowserOnlyNotice.style.display = isPiBrowser ? "none" : "block";
  }
  // --- DOM Element References ---
  const piStatus = document.getElementById("piStatus");
  const piConnectBtn = document.getElementById("piConnectBtn");
  const piUsername = document.getElementById("piUsername");
  const piWallet = document.getElementById("piWallet");
  const createPaymentBtn = document.getElementById("createPaymentBtn");
  const payAmount = document.getElementById("payAmount");
  const payMemo = document.getElementById("payMemo");
  const paymentStatusElement = document.getElementById("paymentStatus"); // Added for payment status display
  const merchantListingForm = document.getElementById("merchantListingForm");
  const merchantOwnerUserId = document.getElementById("merchantOwnerUserId");
  const merchantListingPublicName = document.getElementById("merchantListingPublicName");
  const merchantProfileType = document.getElementById("merchantProfileType");
  const merchantBusinessName = document.getElementById("merchantBusinessName");
  const merchantDescription = document.getElementById("merchantDescription");
  const merchantDomain = document.getElementById("merchantDomain");
  const merchantCategory = document.getElementById("merchantCategory");
  const merchantProductsServices = document.getElementById("merchantProductsServices");
  const merchantCountry = document.getElementById("merchantCountry");
  const merchantCity = document.getElementById("merchantCity");
  const merchantPhone = document.getElementById("merchantPhone");
  const merchantPiWallet = document.getElementById("merchantPiWallet");
  const merchantFormStatus = document.getElementById("merchantFormStatus");
  
  // --- Global Variables ---
  // Assuming API_BASE_URL is globally available or loaded from config
  const API_BASE_URL = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000';
  let currentUser = null;
  let currentPayment = { localPaymentId: null, paymentId: null, txid: null }; // State for demo payment flow
  let editingMerchantId = null;

  // --- Initialization ---
  // piIntegrationManager and piBrowserPayments are initialized globally in their respective files
  const piManager = window.piIntegrationManager;
  
  const approveBtn = document.getElementById("approvePaymentBtn");
  const completeBtn = document.getElementById("completePaymentBtn");
  const merchantAcceptsPiCheckbox = document.getElementById("merchantAcceptsPi");
  const merchantPiPaymentsEnabledCheckbox = document.getElementById("merchantPiPaymentsEnabled");
  const consentTermsCheckbox = document.getElementById("consentTerms");
  const consentPrivacyCheckbox = document.getElementById("consentPrivacy");
  const consentPublicDisplayCheckbox = document.getElementById("consentPublicDisplay");

  function showMerchantFormStatus(message, type = "info") {
    if (!merchantFormStatus) return;

    merchantFormStatus.textContent = message;
    merchantFormStatus.style.padding = "14px 16px";
    merchantFormStatus.style.borderRadius = "14px";
    merchantFormStatus.style.border = "1px solid rgba(255,255,255,0.08)";

    if (type === "error") {
      merchantFormStatus.style.background = "rgba(220, 38, 38, 0.12)";
      merchantFormStatus.style.borderColor = "rgba(220, 38, 38, 0.24)";
      merchantFormStatus.style.color = "#fecaca";
    } else if (type === "success") {
      merchantFormStatus.style.background = "rgba(34, 197, 94, 0.12)";
      merchantFormStatus.style.borderColor = "rgba(34, 197, 94, 0.24)";
      merchantFormStatus.style.color = "#bbf7d0";
    } else {
      merchantFormStatus.style.background = "rgba(59, 130, 246, 0.10)";
      merchantFormStatus.style.borderColor = "rgba(59, 130, 246, 0.24)";
      merchantFormStatus.style.color = "#bfdbfe";
    }
  }
  async function createMerchantListing(event) {
    event.preventDefault();

    if (!merchantFormStatus) return;

    const owner_user_id = merchantOwnerUserId ? merchantOwnerUserId.value.trim() : "";
    const listing_public_name = merchantListingPublicName ? merchantListingPublicName.value.trim() : "";
    const profile_type = merchantProfileType ? merchantProfileType.value : "";
    const business_name = merchantBusinessName ? merchantBusinessName.value.trim() : "";
    const public_description_short = merchantDescription ? merchantDescription.value.trim() : "";
    const domain = merchantDomain ? merchantDomain.value.trim() : "";
    const category = merchantCategory ? merchantCategory.value.trim() : "";
    const products_services_summary = merchantProductsServices ? merchantProductsServices.value.trim() : "";
    const country = merchantCountry ? merchantCountry.value.trim() : "";
    const city = merchantCity ? merchantCity.value.trim() : "";
    const phone_business = merchantPhone ? merchantPhone.value.trim() : "";
    const merchant_pi_wallet = merchantPiWallet ? merchantPiWallet.value.trim() : "";

    const requiredFields = [
      { value: owner_user_id, label: "Owner User ID" },
      { value: listing_public_name, label: "Public Listing Name" },
      { value: profile_type, label: "Profile Type" },
      { value: business_name, label: "Business Name" },
      { value: public_description_short, label: "Short Public Description" },
      { value: domain, label: "Domain" },
      { value: category, label: "Category" },
      { value: products_services_summary, label: "Products / Services Summary" },
      { value: country, label: "Country" },
      { value: city, label: "City" },
      { value: phone_business, label: "Business Phone" }
    ];

    const missingField = requiredFields.find((field) => !field.value);

    if (missingField) {
      showMerchantFormStatus(`❌ Please fill in: ${missingField.label}.`, "error");
      return;
    }

    if (!consentTermsCheckbox?.checked) {
      showMerchantFormStatus("❌ Please accept the Terms of Use.", "error");
      return;
    }

    if (!consentPrivacyCheckbox?.checked) {
      showMerchantFormStatus("❌ Please accept the Privacy Policy.", "error");
      return;
    }

    if (!consentPublicDisplayCheckbox?.checked) {
      showMerchantFormStatus("❌ Please authorize public display settings.", "error");
      return;
    }

    showMerchantFormStatus("⏳ Creating merchant listing...", "info");

    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-listings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          owner_user_id,
          listing_public_name,
          profile_type,
          business_name,
          public_description_short,
          domain,
          category,
          products_services_summary,
          country,
          city,
          phone_business,
          merchant_pi_wallet,
          merchant_pi_payments_enabled: !!merchantPiPaymentsEnabledCheckbox?.checked,
          accepts_pi: !!merchantAcceptsPiCheckbox?.checked,
          consent_terms: !!consentTermsCheckbox?.checked,
          consent_privacy: !!consentPrivacyCheckbox?.checked,
          consent_public_display: !!consentPublicDisplayCheckbox?.checked,
          terms_version_accepted: "v1",
          privacy_version_accepted: "v1",
          listing_policy_version_accepted: "v1"
        })
      });

      const data = await response.json();

      if (!data.ok) {
        showMerchantFormStatus(`❌ ${data.error || "Failed to create merchant listing."}`, "error");
        return;
      }

      showMerchantFormStatus("✅ Merchant listing created successfully.", "success");

      if (merchantListingForm) {
        merchantListingForm.reset();
      }

      if (merchantOwnerUserId && currentUser?.uid) {
        merchantOwnerUserId.value = currentUser.uid;
      }
    } catch (error) {
      showMerchantFormStatus("❌ Failed to contact backend for merchant listing creation.", "error");
    }
  }

  if (window.Pi) {
    if (approveBtn) approveBtn.style.display = "none";
    if (completeBtn) completeBtn.style.display = "none";
  }

  if (createPaymentBtn) {
    createPaymentBtn.addEventListener('click', async () => {
      try {
        const amount = payAmount ? payAmount.value : '';
        const memo = payMemo ? payMemo.value : '';
        let piPaymentHandler = window.piBrowserPayments;

        if (!piPaymentHandler && window.PiBrowserPayments) {
          piPaymentHandler = new window.PiBrowserPayments();
          window.piBrowserPayments = piPaymentHandler;
        }

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
        paymentStatusElement.textContent = '⏳ Requesting Pi payments permission...';
      }

      if (window.piIntegrationManager && typeof window.piIntegrationManager.authPiSdk === 'function') {
        const authResult = await window.piIntegrationManager.authPiSdk();

        if (!authResult || !authResult.ok) {
          if (paymentStatusElement) {
            paymentStatusElement.textContent = `❌ ${authResult?.error || 'Pi authentication failed.'}`;
          }
          return;
        }
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

if (merchantListingForm) {
  merchantListingForm.addEventListener("submit", createMerchantListing);
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
          apiStatusEl.textContent = "Ready in Pi Browser.";
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
