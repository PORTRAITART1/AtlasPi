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
