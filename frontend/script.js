document.addEventListener("DOMContentLoaded", () => {
  // Initialize Pi Integration Manager (DAY 2 / Pi Integration Setup)
  const piManager = new PiIntegrationManager();
  const authHandler = new AtlasPiAuthHandler(piManager);

  // Get API_BASE_URL from config (set in config.js)
  const API_BASE_URL = window.ATLASPI_CONFIG && window.ATLASPI_CONFIG.API_BASE_URL 
    ? window.ATLASPI_CONFIG.API_BASE_URL 
    : 'http://localhost:3000'; // Fallback if config.js not loaded

  const menuToggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");
  const form = document.getElementById("waitlistForm");
  const emailInput = document.getElementById("emailInput");
  const formNote = document.getElementById("formNote");
  const year = document.getElementById("year");

  const apiStatus = document.getElementById("apiStatus");
  const piStatus = document.getElementById("piStatus");
  const piConnectBtn = document.getElementById("piConnectBtn");
  const piUsername = document.getElementById("piUsername");
  const piWallet = document.getElementById("piWallet");

  const payAmount = document.getElementById("payAmount");
  const payMemo = document.getElementById("payMemo");
  const createPaymentBtn = document.getElementById("createPaymentBtn");
  const approvePaymentBtn = document.getElementById("approvePaymentBtn");
  const completePaymentBtn = document.getElementById("completePaymentBtn");
  const paymentStatus = document.getElementById("paymentStatus");

  const loadPaymentsBtn = document.getElementById("loadPaymentsBtn");
  const paymentListStatus = document.getElementById("paymentListStatus");
  const paymentList = document.getElementById("paymentList");

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
  const merchantDistrict = document.getElementById("merchantDistrict");
  const merchantVisibilityDistrict = document.getElementById("merchantVisibilityDistrict");
  const merchantAddress = document.getElementById("merchantAddress");
  const merchantVisibilityAddress = document.getElementById("merchantVisibilityAddress");
  const merchantLocationLink = document.getElementById("merchantLocationLink");
  const merchantVisibilityLocationLink = document.getElementById("merchantVisibilityLocationLink");
  const merchantOwnerName = document.getElementById("merchantOwnerName");
  const merchantVisibilityOwnerName = document.getElementById("merchantVisibilityOwnerName");
  const merchantPhone = document.getElementById("merchantPhone");
  const merchantVisibilityPhone = document.getElementById("merchantVisibilityPhone");
  const merchantWhatsApp = document.getElementById("merchantWhatsApp");
  const merchantVisibilityWhatsApp = document.getElementById("merchantVisibilityWhatsApp");
  const merchantEmail = document.getElementById("merchantEmail");
  const merchantVisibilityEmail = document.getElementById("merchantVisibilityEmail");
  const merchantWebsite = document.getElementById("merchantWebsite");
  const merchantVisibilityWebsite = document.getElementById("merchantVisibilityWebsite");
  const merchantPiWallet = document.getElementById("merchantPiWallet");
  const merchantVisibilityWallet = document.getElementById("merchantVisibilityWallet");
  const merchantPiPaymentsEnabled = document.getElementById("merchantPiPaymentsEnabled");
  const merchantAcceptsPi = document.getElementById("merchantAcceptsPi");
  const consentTerms = document.getElementById("consentTerms");
  const consentPrivacy = document.getElementById("consentPrivacy");
  const consentPublicDisplay = document.getElementById("consentPublicDisplay");
  const merchantFormStatus = document.getElementById("merchantFormStatus");
  const loadMerchantListingsBtn = document.getElementById("loadMerchantListingsBtn");
  const merchantListStatus = document.getElementById("merchantListStatus");
  const merchantListingsList = document.getElementById("merchantListingsList");
  const clearMerchantSearchBtn = document.getElementById("clearMerchantSearchBtn");

  const merchantSearchName = document.getElementById("merchantSearchName");
  const merchantSearchDomain = document.getElementById("merchantSearchDomain");
  const merchantSearchCategory = document.getElementById("merchantSearchCategory");
  const merchantSearchCountry = document.getElementById("merchantSearchCountry");
  const merchantSearchCity = document.getElementById("merchantSearchCity");

  const adminSecret = document.getElementById("adminSecret");
  const togglePendingListings = document.getElementById("togglePendingListings");
  const loadPendingListingsBtn = document.getElementById("loadPendingListingsBtn");
  const moderationStatus = document.getElementById("moderationStatus");
  const pendingListingsList = document.getElementById("pendingListingsList");

  let currentUser = {
    uid: "test-user-001",
    username: "demo_pioneer",
    accessToken: "demo-access-token-123",
    wallet_address: "demo-wallet-not-connected"
  };

  let currentPayment = {
    localPaymentId: null,
    paymentId: null,
    txid: null
  };

  let editingMerchantId = null;

  // Helper function to generate status badge HTML
  function getStatusBadgeHTML(status) {
    const statusClass = status ? status.toLowerCase().replace(/\s+/g, '_') : 'unknown';
    const statusLabels = {
      'pending_review': '📋 Pending Review',
      'approved': '✅ Approved',
      'rejected': '❌ Rejected',
      'suspended': '⛔ Suspended'
    };
    const label = statusLabels[statusClass] || status || 'Unknown';
    return `<span class="status-badge ${statusClass}">${label}</span>`;
  }

  // Helper function to render admin counters
  function renderAdminCounters(counts) {
    const container = document.getElementById('adminCountersContainer');
    if (!container) return;

    const html = `
      <div class="admin-counters">
        <div class="counter-card pending_review">
          <div class="counter-label">📋 Pending Review</div>
          <div class="counter-number">${counts.pending_review || 0}</div>
        </div>
        <div class="counter-card approved">
          <div class="counter-label">✅ Approved</div>
          <div class="counter-number">${counts.approved || 0}</div>
        </div>
        <div class="counter-card rejected">
          <div class="counter-label">❌ Rejected</div>
          <div class="counter-number">${counts.rejected || 0}</div>
        </div>
        <div class="counter-card suspended">
          <div class="counter-label">⛔ Suspended</div>
          <div class="counter-number">${counts.suspended || 0}</div>
        </div>
      </div>
    `;
    container.innerHTML = html;
  }

  // Helper function to count statuses from visible listings
  function countStatusesFromListings() {
    const pendingListings = document.querySelectorAll('#pendingListingsList > div');
    const counts = {
      pending_review: 0,
      approved: 0,
      rejected: 0,
      suspended: 0
    };

    pendingListings.forEach((listingEl) => {
      // Find the status select element in this listing
      const statusSelect = listingEl.querySelector('select[id*="moderationStatus_"]');
      if (statusSelect) {
        const status = statusSelect.value;
        if (counts.hasOwnProperty(status)) {
          counts[status]++;
        }
      }
    });

    return counts;
  }

  // Helper function to update counters
  function updateAdminCounters() {
    const pendingListings = document.querySelectorAll('#pendingListingsList > div');
    if (pendingListings.length === 0) {
      // If no listings loaded, render empty counters
      renderAdminCounters({
        pending_review: 0,
        approved: 0,
        rejected: 0,
        suspended: 0
      });
      return;
    }

    const counts = countStatusesFromListings();
    renderAdminCounters(counts);
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      menu.classList.toggle("open");
    });

    document.querySelectorAll(".menu a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
      });
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      if (!email) {
        formNote.textContent = "Please enter your email address.";
        return;
      }

      if (!email.includes("@") || !email.includes(".")) {
        formNote.textContent = "Please enter a valid email address.";
        return;
      }

      formNote.textContent = "Thank you. Your early-interest request has been noted.";
      emailInput.value = "";
    });
  }

  async function checkBackendStatus() {
    if (!apiStatus) return;

    apiStatus.textContent = "Checking backend connection...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();

      if (data.ok) {
        apiStatus.textContent = "✅ Backend connected successfully.";
      } else {
        apiStatus.textContent = "⚠️ Backend responded, but status is unclear.";
      }
    } catch (error) {
      apiStatus.textContent = "❌ Backend not reachable. Make sure the backend server is running on port 3000.";
    }
  }

  async function connectDemoPiUser() {
    if (!piStatus) return;

    piStatus.textContent = "⏳ Sending demo Pi login to backend...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/pi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          username: currentUser.username,
          accessToken: currentUser.accessToken,
          wallet_address: currentUser.wallet_address
        })
      });

      const data = await response.json();

      if (data.ok) {
        piStatus.textContent = "✅ Demo Pi user connected and saved in backend.";

        if (piUsername) {
          piUsername.textContent = data.user.username;
        }

        if (piWallet) {
          piWallet.textContent = data.user.wallet_address || "-";
        }
      } else {
        piStatus.textContent = `❌ Auth error: ${data.error || "Unknown error"}`;
      }
    } catch (error) {
      piStatus.textContent = "❌ Failed to contact backend for Pi auth.";
    }
  }

  async function createPaymentRecord() {
    if (!paymentStatus) return;

    const amount = payAmount.value.trim();
    const memo = payMemo.value.trim();

    if (!amount) {
      paymentStatus.textContent = "❌ Please enter an amount.";
      return;
    }

    if (Number(amount) <= 0) {
      paymentStatus.textContent = "❌ Amount must be greater than 0.";
      return;
    }

    paymentStatus.textContent = "⏳ Creating payment record...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          username: currentUser.username,
          amount: Number(amount),
          memo: memo,
          metadata: {
            source: "frontend-demo"
          }
        })
      });

      const data = await response.json();

      if (data.ok) {
        currentPayment.localPaymentId = data.localPaymentId;
        currentPayment.paymentId = null;
        currentPayment.txid = null;

        paymentStatus.textContent = `✅ Payment created. Local ID: ${data.localPaymentId}`;
      } else {
        paymentStatus.textContent = `❌ Error: ${data.error || "Unknown error"}`;
      }
    } catch (error) {
      paymentStatus.textContent = "❌ Failed to contact backend for payment creation.";
    }
  }

  async function approvePaymentRecord() {
    if (!paymentStatus) return;

    if (!currentPayment.localPaymentId) {
      paymentStatus.textContent = "❌ Please create a payment first.";
      return;
    }

    const demoPaymentId = `pi-demo-${Date.now()}`;
    paymentStatus.textContent = "⏳ Approving payment...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          localPaymentId: currentPayment.localPaymentId,
          paymentId: demoPaymentId
        })
      });

      const data = await response.json();

      if (data.ok) {
        currentPayment.paymentId = data.paymentId;
        paymentStatus.textContent = `✅ Payment approved. Pi Payment ID: ${data.paymentId}`;
      } else {
        paymentStatus.textContent = `❌ Approve error: ${data.error || "Unknown error"}`;
      }
    } catch (error) {
      paymentStatus.textContent = "❌ Failed to contact backend for payment approval.";
    }
  }

  async function completePaymentRecord() {
    if (!paymentStatus) return;

    if (!currentPayment.localPaymentId) {
      paymentStatus.textContent = "❌ Please create a payment first.";
      return;
    }

    if (!currentPayment.paymentId) {
      paymentStatus.textContent = "❌ Please approve the payment first.";
      return;
    }

    const demoTxid = `tx-demo-${Date.now()}`;
    paymentStatus.textContent = "⏳ Completing payment...";

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.accessToken}`
        },
        body: JSON.stringify({
          localPaymentId: currentPayment.localPaymentId,
          paymentId: currentPayment.paymentId,
          txid: demoTxid
        })
      });

      const data = await response.json();

      if (data.ok) {
        currentPayment.txid = data.txid;
        paymentStatus.textContent = `✅ Payment completed. TXID: ${data.txid}`;
      } else {
        paymentStatus.textContent = `❌ Complete error: ${data.error || "Unknown error"}`;
      }
    } catch (error) {
      paymentStatus.textContent = "❌ Failed to contact backend for payment completion.";
    }
  }

  async function loadPaymentsList() {
    if (!paymentListStatus || !paymentList) return;

    paymentListStatus.textContent = "⏳ Loading payments list...";
    paymentList.innerHTML = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/list`);
      const data = await response.json();

      if (!data.ok) {
        paymentListStatus.textContent = `❌ Error: ${data.error || "Unknown error"}`;
        return;
      }

      if (!data.payments || data.payments.length === 0) {
        paymentListStatus.textContent = "ℹ️ No payments found.";
        return;
      }

      paymentListStatus.textContent = `✅ ${data.count} payment(s) loaded.`;

      data.payments.forEach((payment) => {
        const item = document.createElement("div");
        item.style.background = "rgba(255,255,255,0.05)";
        item.style.border = "1px solid rgba(255,255,255,0.08)";
        item.style.borderRadius = "12px";
        item.style.padding = "12px";
        item.style.marginBottom = "10px";

        item.innerHTML = `
          <p><strong>User:</strong> ${payment.username}</p>
          <p><strong>Amount:</strong> ${payment.amount}</p>
          <p><strong>Status:</strong> ${payment.status}</p>
          <p><strong>Local ID:</strong> ${payment.local_payment_id || "-"}</p>
          <p><strong>Pi Payment ID:</strong> ${payment.pi_payment_id || "-"}</p>
          <p><strong>TXID:</strong> ${payment.txid || "-"}</p>
        `;

        paymentList.appendChild(item);
      });
    } catch (error) {
      paymentListStatus.textContent = "❌ Failed to load payments list.";
    }
  }

  async function loadMerchantListings() {
    if (!merchantListStatus || !merchantListingsList) return;

    merchantListStatus.textContent = "⏳ Loading merchant listings...";
    merchantListingsList.innerHTML = "";

    const searchName = merchantSearchName ? merchantSearchName.value.trim() : "";
    const searchDomain = merchantSearchDomain ? merchantSearchDomain.value.trim() : "";
    const searchCategory = merchantSearchCategory ? merchantSearchCategory.value.trim() : "";
    const searchCountry = merchantSearchCountry ? merchantSearchCountry.value.trim() : "";
    const searchCity = merchantSearchCity ? merchantSearchCity.value.trim() : "";

    const params = new URLSearchParams();
    if (searchName) params.append("name", searchName);
    if (searchDomain) params.append("domain", searchDomain);
    if (searchCategory) params.append("category", searchCategory);
    if (searchCountry) params.append("country", searchCountry);
    if (searchCity) params.append("city", searchCity);

    const searchUrl = `${API_BASE_URL}/api/merchant-listings/search${params.toString() ? "?" + params.toString() : ""}`;

    try {
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (!data.ok) {
        merchantListStatus.textContent = `❌ Error: ${data.error || "Unknown error"}`;
        return;
      }

      const listings = data.listings || [];

      if (!listings || listings.length === 0) {
        merchantListStatus.textContent = "ℹ️ No merchant listings match your search.";
        return;
      }

      merchantListStatus.textContent = `✅ ${listings.length} merchant listing(s) found.`;

      listings.forEach((listing) => {
        const item = document.createElement("div");
        item.style.background = "rgba(220,38,38,0.08)";
        item.style.border = "2px solid rgba(220,38,38,0.3)";
        item.style.borderRadius = "12px";
        item.style.padding = "16px";
        item.style.marginBottom = "16px";
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";
        item.style.transition = "opacity 0.3s, transform 0.3s";

        const currentReason = listing.moderation_reason ? listing.moderation_reason.substring(0, 60) + (listing.moderation_reason.length > 60 ? '...' : '') : "(none)";

        item.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="margin: 0 0 12px 0;"><strong style="color: #7c3aed;">ID #${listing.id}</strong> | UUID: ${(listing.listing_uuid || "-").substring(0, 8)}...</p>
              <p><strong>Name:</strong> ${listing.listing_public_name || "-"}</p>
              <p><strong>Business:</strong> ${listing.business_name || "-"}</p>
              <p><strong>Type:</strong> ${listing.profile_type || "-"}</p>
              <p><strong>Domain:</strong> ${listing.domain || "-"}</p>
              <p><strong>Category:</strong> ${listing.category || "-"}</p>
              <p><strong>Location:</strong> ${listing.city || "-"}, ${listing.country || "-"}</p>
              <p><strong>Status:</strong> ${getStatusBadgeHTML(listing.listing_status)}</p>
              <p><strong>Current Reason:</strong> <span style="color: #a78bfa;">${currentReason}</span></p>
            </div>

            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
              <div style="margin-bottom: 12px;">
                <label for="moderationStatus_${listing.id}" style="display: block; font-size: 13px; margin-bottom: 6px;"><strong>Change Status To:</strong></label>
                <select id="moderationStatus_${listing.id}" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white;">
                  <option value="pending_review">📋 Pending Review</option>
                  <option value="approved" selected>✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="suspended">⛔ Suspended</option>
                </select>
              </div>

              <div style="margin-bottom: 12px;">
                <label for="moderationReason_${listing.id}" style="display: block; font-size: 12px; margin-bottom: 4px;"><strong>Moderation Reason (optional)</strong></label>
                <textarea id="moderationReason_${listing.id}" placeholder="e.g., Missing documents, incomplete info, duplicate listing..." style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white; min-height: 60px; resize: vertical; font-family: monospace; font-size: 11px;"></textarea>
              </div>

              <button type="button" class="btn-moderate" data-id="${listing.id}" data-secret="${secret}" style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: white; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
                ✓ Apply Moderation
              </button>

              <a href="#merchant-form-section" style="text-align: center; padding: 8px; background: rgba(124,58,237,0.1); border-radius: 6px; color: #7c3aed; text-decoration: none; font-size: 13px;">📝 Load for Edit</a>

              <button type="button" class="btn-history" data-id="${listing.id}" data-secret="${secret}" style="width: 100%; margin-top: 10px; padding: 8px; background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid #3b82f6; border-radius: 6px; cursor: pointer; font-size: 12px;">📋 View History</button>
            </div>
          </div>

          <div id="moderationHistory_${listing.id}" style="display: none; margin-top: 12px;"></div>
        `;

        merchantListingsList.appendChild(item);

        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, 50);
      });

      document.querySelectorAll(".btn-moderate").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const statusSelect = document.getElementById(`moderationStatus_${id}`);
          const newStatus = statusSelect ? statusSelect.value : "approved";
          const adminSec = btn.getAttribute("data-secret");

          await moderateListing(id, newStatus, adminSec);
        });
      });

      document.querySelectorAll(".btn-history").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const secret = btn.getAttribute("data-secret");
          const historyContainer = document.getElementById("moderationHistory_" + id);
          if (historyContainer.style.display === "none") {
            historyContainer.style.display = "block";
            await loadModerationHistory(id, secret);
          } else {
            historyContainer.style.display = "none";
          }
        });
      });
    } catch (error) {
      moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Failed to load pending listings.</p>';
    }
  }

  function loadPendingListings() {
    if (!adminSecret || !adminSecret.value) {
      moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Please enter your admin secret first.</p>';
      return;
    }
    const secret = adminSecret.value;
    loadPendingListingsWithSecret(secret);
  }

  async function loadPendingListingsWithSecret(secret) {
    if (!moderationStatus || !pendingListingsList) return;

    moderationStatus.innerHTML = '<p style="margin: 0;">⏳ Loading pending listings...</p>';
    pendingListingsList.innerHTML = "";

    try {
      const response = await fetch(`${API_BASE_URL}/api/merchant-listings/pending`, {
        headers: { 'x-admin-secret': secret }
      });

      const data = await response.json();

      if (!data.ok) {
        moderationStatus.innerHTML = `<p style="margin: 0; color: #dc2626;">❌ Error: ${data.error || 'Unknown error'}</p>`;
        updateAdminCounters();
        return;
      }

      const listings = data.listings || [];

      if (!listings || listings.length === 0) {
        moderationStatus.innerHTML = '<p style="margin: 0; color: #3b82f6;">ℹ️ No pending listings to review.</p>';
        updateAdminCounters();
        return;
      }

      moderationStatus.innerHTML = `<p style="margin: 0; color: #10b981;">✅ ${listings.length} pending listing(s) loaded for review.</p>`;

      listings.forEach((listing) => {
        const item = document.createElement("div");
        item.style.background = "rgba(217, 119, 6, 0.08)";
        item.style.border = "2px solid rgba(217, 119, 6, 0.3)";
        item.style.borderRadius = "12px";
        item.style.padding = "16px";
        item.style.marginBottom = "16px";
        item.style.opacity = "0";
        item.style.transform = "translateY(10px)";
        item.style.transition = "opacity 0.3s, transform 0.3s";

        const currentReason = listing.moderation_reason ? listing.moderation_reason.substring(0, 60) + (listing.moderation_reason.length > 60 ? '...' : '') : "(none)";

        item.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="margin: 0 0 12px 0;"><strong style="color: #7c3aed;">ID #${listing.id}</strong> | UUID: ${(listing.listing_uuid || "-").substring(0, 8)}...</p>
              <p><strong>Name:</strong> ${listing.listing_public_name || "-"}</p>
              <p><strong>Business:</strong> ${listing.business_name || "-"}</p>
              <p><strong>Type:</strong> ${listing.profile_type || "-"}</p>
              <p><strong>Domain:</strong> ${listing.domain || "-"}</p>
              <p><strong>Category:</strong> ${listing.category || "-"}</p>
              <p><strong>Location:</strong> ${listing.city || "-"}, ${listing.country || "-"}</p>
              <p><strong>Status:</strong> ${getStatusBadgeHTML(listing.listing_status)}</p>
              <p><strong>Reason:</strong> <span style="color: #a78bfa;">${currentReason}</span></p>
            </div>

            <div style="display: flex; flex-direction: column; justify-content: flex-start;">
              <div style="margin-bottom: 12px;">
                <label for="moderationStatus_${listing.id}" style="display: block; font-size: 13px; margin-bottom: 6px;"><strong>Change Status To:</strong></label>
                <select id="moderationStatus_${listing.id}" style="width: 100%; padding: 10px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white;">
                  <option value="pending_review" selected>📋 Pending Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="suspended">⛔ Suspended</option>
                </select>
              </div>

              <div style="margin-bottom: 12px;">
                <label for="moderationReason_${listing.id}" style="display: block; font-size: 12px; margin-bottom: 4px;"><strong>Moderation Reason (optional)</strong></label>
                <textarea id="moderationReason_${listing.id}" placeholder="e.g., Missing documents, incomplete info, duplicate listing..." style="width: 100%; padding: 8px; border-radius: 6px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); color: white; min-height: 60px; resize: vertical; font-family: monospace; font-size: 11px;"></textarea>
              </div>

              <button type="button" class="btn-moderate" data-id="${listing.id}" data-secret="${secret}" style="background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%); color: white; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">
                ✓ Apply Moderation
              </button>

              <button type="button" class="btn-history" data-id="${listing.id}" data-secret="${secret}" style="width: 100%; margin-top: 10px; padding: 8px; background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid #3b82f6; border-radius: 6px; cursor: pointer; font-size: 12px;">📋 View History</button>
            </div>
          </div>

          <div id="moderationHistory_${listing.id}" style="display: none; margin-top: 12px;"></div>
        `;

        pendingListingsList.appendChild(item);

        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, 50);
      });

      // Update counters after listings are loaded
      setTimeout(() => {
        updateAdminCounters();
      }, 100);

      document.querySelectorAll(".btn-moderate").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const statusSelect = document.getElementById(`moderationStatus_${id}`);
          const newStatus = statusSelect ? statusSelect.value : "pending_review";
          const adminSec = btn.getAttribute("data-secret");

          await moderateListing(id, newStatus, adminSec);
        });
      });

      document.querySelectorAll(".btn-history").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-id");
          const adminSec = btn.getAttribute("data-secret");
          const historyContainer = document.getElementById("moderationHistory_" + id);
          if (historyContainer.style.display === "none") {
            historyContainer.style.display = "block";
            await loadModerationHistory(id, adminSec);
          } else {
            historyContainer.style.display = "none";
          }
        });
      });
    } catch (error) {
      moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Failed to load pending listings.</p>';
      updateAdminCounters();
    }
  }

  async function moderateListing(id, newStatus, secret) {
    if (!moderationStatus) return;

    const reasonTextarea = document.getElementById('moderationReason_' + id);
    const reason = reasonTextarea ? reasonTextarea.value.trim() : '';

    moderationStatus.innerHTML = '<p style="margin: 0;">⏳ Moderating listing #' + id + '...</p>';

    try {
      const response = await fetch(API_BASE_URL + '/api/merchant-listings/moderate/' + id, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({
          listing_status: newStatus,
          moderation_reason: reason
        })
      });

      const data = await response.json();

      if (data.ok) {
        const reasonDisplay = reason ? ' | Reason: ' + reason : '';
        moderationStatus.innerHTML = '<p style="margin: 0; color: #10b981;">✅ Listing #' + id + ' status changed to ' + getStatusBadgeHTML(newStatus) + reasonDisplay + '. Reloading...</p>';
        
        setTimeout(() => {
          loadPendingListingsWithSecret(secret);
        }, 1500);
      } else {
        moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Moderation error: ' + (data.error || 'Unknown error') + '</p>';
      }
    } catch (error) {
      moderationStatus.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Failed to contact backend for moderation.</p>';
    }
  }

  async function loadModerationHistory(listingId, secret) {
    const historyContainer = document.getElementById('moderationHistory_' + listingId);
    if (!historyContainer) return;
    historyContainer.innerHTML = '<p style="margin: 0; color: #7c3aed;">⏳ Loading history...</p>';
    try {
      const response = await fetch(API_BASE_URL + '/api/merchant-listings/moderation-history/' + listingId, {
        method: 'GET',
        headers: { 'x-admin-secret': secret }
      });
      const data = await response.json();
      if (!data.ok) {
        historyContainer.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Error: ' + (data.error || 'Failed') + '</p>';
        return;
      }
      if (!data.history || data.history.length === 0) {
        historyContainer.innerHTML = '<p style="margin: 0; color: #3b82f6;">ℹ️ No history yet.</p>';
        return;
      }
      let html = '<div style="margin-top: 12px; padding: 12px; background: rgba(59,130,246,0.1); border-radius: 6px; border-left: 3px solid #3b82f6;"><p style="margin: 0 0 12px 0; font-weight: bold; color: #3b82f6;">📋 History (' + data.count + '):</p>';
      data.history.forEach((entry, idx) => {
        const date = new Date(entry.created_at).toLocaleString();
        html += '<div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; font-size: 12px;">';
        html += '<p style="margin: 0; color: #a78bfa;"><strong>#' + (idx + 1) + '</strong> ' + date + '</p>';
        html += '<p style="margin: 2px 0; color: #f59e0b;"><strong>' + getStatusBadgeHTML(entry.previous_status) + '</strong> → <strong>' + getStatusBadgeHTML(entry.new_status) + '</strong></p>';
        if (entry.moderation_reason) {
          html += '<p style="margin: 2px 0; color: #10b981; font-style: italic;">📝 ' + entry.moderation_reason + '</p>';
        }
        html += '<p style="margin: 2px 0; color: #6b7280; font-size: 11px;">By: ' + entry.moderated_by + '</p>';
        html += '</div>';
      });
      html += '</div>';
      historyContainer.innerHTML = html;
    } catch (error) {
      historyContainer.innerHTML = '<p style="margin: 0; color: #dc2626;">❌ Failed.</p>';
    }
  }

  if (piConnectBtn) {
    piConnectBtn.addEventListener("click", connectDemoPiUser);
  }

  if (createPaymentBtn) {
    createPaymentBtn.addEventListener("click", createPaymentRecord);
  }

  if (approvePaymentBtn) {
    approvePaymentBtn.addEventListener("click", approvePaymentRecord);
  }

  if (completePaymentBtn) {
    completePaymentBtn.addEventListener("click", completePaymentRecord);
  }

  if (loadPaymentsBtn) {
    loadPaymentsBtn.addEventListener("click", loadPaymentsList);
  }

  if (loadMerchantListingsBtn) {
    loadMerchantListingsBtn.addEventListener("click", loadMerchantListings);
  }

  if (clearMerchantSearchBtn) {
    clearMerchantSearchBtn.addEventListener("click", clearMerchantSearch);
  }

  if (merchantListingForm) {
    merchantListingForm.addEventListener("submit", createMerchantListing);
  }

  if (loadPendingListingsBtn) {
    loadPendingListingsBtn.addEventListener("click", loadPendingListings);
  }

  checkBackendStatus();
  loadMerchantListings();
});
