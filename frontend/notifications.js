/**
 * AtlasPi — Notifications System
 * Toast notifications + VIP alerts
 * v1.0 — Mainnet
 */

(function () {
  // ── Inject styles ──────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    #atlaspi-toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .atlaspi-toast {
      pointer-events: all;
      min-width: 280px;
      max-width: 360px;
      padding: 14px 18px;
      border-radius: 14px;
      font-size: 0.92rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.35);
      backdrop-filter: blur(12px);
      animation: toastIn 0.3s ease forwards;
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
    }

    .atlaspi-toast.success {
      background: rgba(16, 185, 129, 0.18);
      border-color: rgba(16, 185, 129, 0.35);
    }

    .atlaspi-toast.error {
      background: rgba(220, 38, 38, 0.18);
      border-color: rgba(220, 38, 38, 0.35);
    }

    .atlaspi-toast.info {
      background: rgba(59, 130, 246, 0.18);
      border-color: rgba(59, 130, 246, 0.35);
    }

    .atlaspi-toast.vip {
      background: rgba(124, 58, 237, 0.22);
      border-color: rgba(124, 58, 237, 0.45);
    }

    .atlaspi-toast.warning {
      background: rgba(245, 158, 11, 0.18);
      border-color: rgba(245, 158, 11, 0.35);
    }

    .atlaspi-toast-close {
      margin-left: auto;
      cursor: pointer;
      opacity: 0.6;
      font-size: 1rem;
      background: none;
      border: none;
      color: inherit;
      padding: 0 4px;
    }

    .atlaspi-toast-close:hover { opacity: 1; }

    @keyframes toastIn {
      from { opacity: 0; transform: translateY(16px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes toastOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to   { opacity: 0; transform: translateY(16px) scale(0.97); }
    }

    @media (max-width: 640px) {
      #atlaspi-toast-container {
        bottom: 16px;
        right: 8px;
        left: 8px;
      }
      .atlaspi-toast { min-width: unset; max-width: 100%; }
    }
  `;
  document.head.appendChild(style);

  // ── Create container ───────────────────────────────────────
  const container = document.createElement("div");
  container.id = "atlaspi-toast-container";
  document.body.appendChild(container);

  // ── Icons ──────────────────────────────────────────────────
  const icons = {
    success: "✅",
    error:   "❌",
    info:    "ℹ️",
    vip:     "💎",
    warning: "⚠️",
  };

  // ── Show toast ─────────────────────────────────────────────
  function showToast(message, type = "info", duration = 4000) {
    const toast = document.createElement("div");
    toast.className = `atlaspi-toast ${type}`;
    toast.innerHTML = `
      <span>${icons[type] || "ℹ️"}</span>
      <span>${message}</span>
      <button class="atlaspi-toast-close" aria-label="Close">✕</button>
    `;

    const closeBtn = toast.querySelector(".atlaspi-toast-close");
    closeBtn.addEventListener("click", () => dismissToast(toast));

    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => dismissToast(toast), duration);
    }

    return toast;
  }

  function dismissToast(toast) {
    toast.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }

  // ── VIP expiry warning ─────────────────────────────────────
  function checkVIPExpiry(vipExpiry) {
    if (!vipExpiry) return;
    const expiry = new Date(vipExpiry);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      showToast("Your VIP has expired. Renew to keep benefits.", "warning", 8000);
    } else if (daysLeft <= 5) {
      showToast(`💎 VIP expires in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Renew soon!`, "vip", 8000);
    }
  }

  // ── Public API ─────────────────────────────────────────────
  window.AtlasPiNotify = {
    success: (msg, duration) => showToast(msg, "success", duration),
    error:   (msg, duration) => showToast(msg, "error", duration),
    info:    (msg, duration) => showToast(msg, "info", duration),
    vip:     (msg, duration) => showToast(msg, "vip", duration),
    warning: (msg, duration) => showToast(msg, "warning", duration),
    checkVIPExpiry,
  };

  console.log("✅ AtlasPi Notifications loaded");
})();
