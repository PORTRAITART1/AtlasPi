// Add admin toggle + mini menu functionality
document.addEventListener("DOMContentLoaded", () => {
  const adminSection = document.getElementById("merchant-moderation-section");
  const toggleAdminBtn = document.getElementById("toggleAdminBtn");
  
  // Hide admin section on page load
  if (adminSection) {
    adminSection.style.display = "none";
    console.log("Admin section hidden on load");
  }
  
  // Add IDs to admin subsections if missing
  addAdminSectionIDs();
  
  // Add toggle button if it doesn't exist
  if (!toggleAdminBtn && adminSection) {
    const toggleDiv = document.createElement("div");
    toggleDiv.style.textAlign = "center";
    toggleDiv.style.padding = "40px 20px";
    toggleDiv.style.marginTop = "60px";
    
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "toggleAdminBtn";
    btn.textContent = "🔐 Show Admin Moderation";
    btn.style.padding = "14px 28px";
    btn.style.background = "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "8px";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "bold";
    btn.style.fontSize = "16px";
    btn.style.boxShadow = "0 6px 16px rgba(220,38,38,0.35)";
    btn.style.transition = "all 0.3s ease";
    
    btn.addEventListener("mouseover", () => {
      btn.style.transform = "translateY(-2px)";
      btn.style.boxShadow = "0 8px 20px rgba(220,38,38,0.4)";
    });
    
    btn.addEventListener("mouseout", () => {
      btn.style.transform = "translateY(0)";
      btn.style.boxShadow = "0 6px 16px rgba(220,38,38,0.35)";
    });
    
    btn.addEventListener("click", toggleAdmin);
    
    toggleDiv.appendChild(btn);
    adminSection.parentNode.insertBefore(toggleDiv, adminSection);
  }
  
  // Set up existing toggle button if present
  if (toggleAdminBtn) {
    toggleAdminBtn.addEventListener("click", toggleAdmin);
  }

  const loadPendingListingsBtn = document.getElementById("loadPendingListingsBtn");
  const adminSecretInput = document.getElementById("adminSecret");
  const moderationStatus = document.getElementById("moderationStatus");
  const pendingListingsList = document.getElementById("pendingListingsList");

  if (loadPendingListingsBtn) {
    loadPendingListingsBtn.addEventListener("click", async () => {
      const secret = adminSecretInput ? adminSecretInput.value.trim() : "";

      if (!secret) {
        if (moderationStatus) {
          moderationStatus.innerHTML = '<p style="margin:0;color:#dc2626;">❌ Please enter your admin secret.</p>';
        }
        return;
      }

      if (moderationStatus) {
        moderationStatus.innerHTML = '<p style="margin:0;">⏳ Loading pending listings...</p>';
      }

      if (pendingListingsList) {
        pendingListingsList.innerHTML = "";
      }

      try {
        const apiBase = window.ATLASPI_CONFIG?.API_BASE_URL || "https://atlaspi-backend.onrender.com";
        const response = await fetch(`${apiBase}/api/merchant-listings/pending`, {
          headers: {
            "x-admin-secret": secret
          }
        });

        const data = await response.json();

        if (!data.ok) {
          if (moderationStatus) {
            moderationStatus.innerHTML = `<p style="margin:0;color:#dc2626;">❌ ${data.error || "Failed to load pending listings."}</p>`;
          }
          return;
        }

        const listings = data.listings || [];

        if (!listings.length) {
          if (moderationStatus) {
            moderationStatus.innerHTML = '<p style="margin:0;color:#3b82f6;">ℹ️ No pending listings to review.</p>';
          }
          return;
        }

        if (moderationStatus) {
          moderationStatus.innerHTML = `<p style="margin:0;color:#10b981;">✅ ${listings.length} pending listing(s) loaded.</p>`;
        }

        if (pendingListingsList) {
          listings.forEach((listing) => {
            const item = document.createElement("div");
            item.style.marginTop = "12px";
            item.style.padding = "16px";
            item.style.borderRadius = "14px";
            item.style.background = "rgba(255,255,255,0.05)";
            item.style.border = "1px solid rgba(255,255,255,0.08)";

            item.innerHTML = `
  <p><strong>${listing.listing_public_name || "-"}</strong></p>
  <p><strong>Business:</strong> ${listing.business_name || "-"}</p>
  <p><strong>Profile Type:</strong> ${listing.profile_type || "-"}</p>
  <p><strong>Domain:</strong> ${listing.domain || "-"}</p>
  <p><strong>Category:</strong> ${listing.category || "-"}</p>
  <p><strong>Status:</strong> ${listing.listing_status || "-"}</p>
  <p><strong>Verification:</strong> ${listing.verification_status || "-"}</p>
  <p><strong>City:</strong> ${listing.city || "-"}</p>
  <p><strong>Country:</strong> ${listing.country || "-"}</p>
  <p><strong>Accepts Pi:</strong> ${listing.accepts_pi ? "Yes" : "No"}</p>
  <p><strong>Pi Payments Enabled:</strong> ${listing.merchant_pi_payments_enabled ? "Yes" : "No"}</p>
  <p><strong>Merchant Pi Wallet:</strong> ${listing.merchant_pi_wallet || "-"}</p>
  <p><strong>Created:</strong> ${listing.created_at || "-"}</p>

  <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
    <button type="button" class="btn btn-primary approve-listing-btn">Approve</button>
    <button type="button" class="btn btn-secondary reject-listing-btn">Reject</button>
    <button type="button" class="btn btn-secondary suspend-listing-btn">Suspend</button>
  </div>
`;

            const approveBtn = item.querySelector(".approve-listing-btn");
            const rejectBtn = item.querySelector(".reject-listing-btn");
            const suspendBtn = item.querySelector(".suspend-listing-btn");

            async function moderateListing(nextStatus, reason = "") {
              try {
                if (moderationStatus) {
                  moderationStatus.innerHTML = `<p style="margin:0;">⏳ Updating listing #${listing.id}...</p>`;
                }

                const response = await fetch(`${apiBase}/api/merchant-listings/moderate/${listing.id}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-admin-secret": secret
                  },
                  body: JSON.stringify({
                    listing_status: nextStatus,
                    moderation_reason: reason
                  })
                });

                const result = await response.json();

                if (!result.ok) {
                  if (moderationStatus) {
                    moderationStatus.innerHTML = `<p style="margin:0;color:#dc2626;">❌ ${result.error || "Moderation failed."}</p>`;
                  }
                  return;
                }

                if (moderationStatus) {
                  moderationStatus.innerHTML = `<p style="margin:0;color:#10b981;">✅ ${result.message}</p>`;
                }

                if (loadPendingListingsBtn) {
                  loadPendingListingsBtn.click();
                }
              } catch (error) {
                if (moderationStatus) {
                  moderationStatus.innerHTML = `<p style="margin:0;color:#dc2626;">❌ Failed to update listing.</p>`;
                }
              }
            }

            if (approveBtn) {
              approveBtn.addEventListener("click", () => {
                moderateListing("approved");
              });
            }

            if (rejectBtn) {
              rejectBtn.addEventListener("click", () => {
                const reason = window.prompt("Optional rejection reason:", "") || "";
                moderateListing("rejected", reason);
              });
            }

            if (suspendBtn) {
              suspendBtn.addEventListener("click", () => {
                const reason = window.prompt("Optional suspension reason:", "") || "";
                moderateListing("suspended", reason);
              });
            }

            pendingListingsList.appendChild(item);
          });
        }
      } catch (error) {
        if (moderationStatus) {
          moderationStatus.innerHTML = '<p style="margin:0;color:#dc2626;">❌ Failed to contact backend.</p>';
        }
      }
    });
  }
});

function addAdminSectionIDs() {
  const adminSection = document.getElementById("merchant-moderation-section");
  if (!adminSection) return;

  // Find containers for each subsection and add IDs if missing
  const container = adminSection.querySelector(".container");
  if (!container) return;

  // Add IDs to key elements for navigation
  const ctaCard = container.querySelector(".cta-card");
  if (ctaCard && !ctaCard.id) {
    ctaCard.id = "admin-tools-section";
  }

  // Find pending listings container
  const pendingListingsDiv = document.getElementById("pendingListingsList");
  if (pendingListingsDiv) {
    const parent = pendingListingsDiv.parentNode;
    if (parent && !parent.id) {
      parent.id = "pending-listings-section";
    }
  }
}

function toggleAdmin() {
  const adminSection = document.getElementById("merchant-moderation-section");
  const toggleAdminBtn = document.getElementById("toggleAdminBtn");
  const miniMenu = document.getElementById("admin-mini-menu");
  
  if (!adminSection) return;
  
  if (adminSection.style.display === "none") {
    // Show admin section
    adminSection.style.display = "block";
    adminSection.style.animation = "fadeInUp 0.3s ease";
    if (toggleAdminBtn) {
      toggleAdminBtn.textContent = "🔐 Hide Admin Moderation";
    }
    
    // Show mini menu
    if (miniMenu) {
      miniMenu.style.display = "block";
    } else {
      createAdminMiniMenu();
    }
    
    console.log("Admin section shown");
  } else {
    // Hide admin section
    adminSection.style.display = "none";
    if (toggleAdminBtn) {
      toggleAdminBtn.textContent = "🔐 Show Admin Moderation";
    }
    
    // Hide mini menu
    if (miniMenu) {
      miniMenu.style.display = "none";
    }
    
    console.log("Admin section hidden");
  }
}

function createAdminMiniMenu() {
  const adminSection = document.getElementById("merchant-moderation-section");
  if (!adminSection) return;

  const container = adminSection.querySelector(".container");
  if (!container) return;

  // Create mini menu container
  const miniMenu = document.createElement("div");
  miniMenu.id = "admin-mini-menu";
  miniMenu.style.background = "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(124,58,237,0.08) 100%)";
  miniMenu.style.padding = "16px";
  miniMenu.style.borderRadius = "8px";
  miniMenu.style.marginBottom = "24px";
  miniMenu.style.border = "1px solid rgba(220,38,38,0.2)";

  // Title
  const title = document.createElement("p");
  title.textContent = "📋 Quick Navigation:";
  title.style.margin = "0 0 12px 0";
  title.style.fontSize = "13px";
  title.style.fontWeight = "bold";
  title.style.color = "#fca5a5";
  title.style.textTransform = "uppercase";
  title.style.letterSpacing = "0.5px";
  miniMenu.appendChild(title);

  // Buttons container
  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.display = "flex";
  buttonsContainer.style.gap = "10px";
  buttonsContainer.style.flexWrap = "wrap";

  // Navigation buttons
  const navItems = [
    { label: "🔑 Access & Secrets", id: "admin-tools-section" },
    { label: "📋 Pending Listings", id: "pending-listings-section" },
    { label: "📖 History", id: "moderation-history-section" }
  ];

  navItems.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = item.label;
    btn.style.padding = "8px 14px";
    btn.style.background = "rgba(59,130,246,0.15)";
    btn.style.border = "1px solid #3b82f6";
    btn.style.borderRadius = "6px";
    btn.style.color = "#60a5fa";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "bold";
    btn.style.transition = "all 0.2s ease";

    btn.addEventListener("mouseover", () => {
      btn.style.background = "rgba(59,130,246,0.25)";
      btn.style.transform = "translateY(-1px)";
    });

    btn.addEventListener("mouseout", () => {
      btn.style.background = "rgba(59,130,246,0.15)";
      btn.style.transform = "translateY(0)";
    });

    btn.addEventListener("click", () => {
      scrollToSection(item.id);
    });

    buttonsContainer.appendChild(btn);
  });

  miniMenu.appendChild(buttonsContainer);

  // Insert menu at the top of admin section
  const firstChild = container.firstChild;
  container.insertBefore(miniMenu, firstChild);
  console.log("Admin mini menu created");
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    console.log("Scrolled to section:", sectionId);
  } else {
    console.warn("Section not found:", sectionId);
  }
}
