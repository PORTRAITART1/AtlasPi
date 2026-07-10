/**
 * pi-payment-init.js
 * Gère l'état du bouton VIP, la détection de session,
 * et le déclenchement du paiement Pi.
 */

(function () {
  "use strict";

  // ─── Helpers ────────────────────────────────────────────────
  function getUserFromStorage() {
    try {
      const raw = localStorage.getItem("piUser");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) return parsed;
      return null;
    } catch (e) {
      return null;
    }
  }

  function setPaymentStatus(msg, color) {
    const el = document.getElementById("paymentStatus");
    if (el) {
      el.textContent = msg;
      el.style.color = color || "#6b7280";
    }
  }

  function setButtonState(enabled) {
    const btn = document.getElementById("createPaymentBtn");
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.5";
    btn.style.cursor = enabled ? "pointer" : "not-allowed";
  }

  function fillMerchantUID(uid) {
    const el = document.getElementById("merchantOwnerUserId");
    if (el && uid) el.value = uid;
  }

  // ─── UI Update ───────────────────────────────────────────────
  function updateUIForUser(user) {
    if (user && user.uid) {
      setPaymentStatus("✅ Ready to activate VIP.", "#10b981");
      setButtonState(true);
      fillMerchantUID(user.uid);

      // Met à jour le bouton Pi connect si présent
      const piConnectBtn = document.getElementById("piConnectBtn");
      if (piConnectBtn) {
        piConnectBtn.textContent = `✓ Connected: ${user.username || "User"}`;
        piConnectBtn.disabled = true;
        piConnectBtn.style.opacity = "0.7";
      }

      const piStatus = document.getElementById("piStatus");
      if (piStatus) {
        piStatus.textContent = `✅ Logged in as ${user.username || user.uid}`;
        piStatus.style.color = "#10b981";
      }
    } else {
      setPaymentStatus("🔐 Connect with Pi first to unlock VIP.", "#f59e0b");
      setButtonState(false);
    }
  }

  // ─── Init ────────────────────────────────────────────────────
  function init() {
    // 1. Vérifie session localStorage en premier
    let user = getUserFromStorage();

    if (user) {
      console.log("[PaymentInit] User found in localStorage:", user.username);
      updateUIForUser(user);
    } else {
      // 2. Essaie Pi SDK si disponible
      if (
        window.Pi &&
        typeof window.Pi.authenticate === "function" &&
        window._piSdkReady
      ) {
        console.log("[PaymentInit] Trying Pi SDK silent auth...");
        window.Pi.authenticate(["username", "payments"], { onIncompletePaymentFound: () => {} })
          .then((authResult) => {
            if (authResult && authResult.user) {
              const sdkUser = {
                uid: authResult.user.uid,
                username: authResult.user.username,
              };
              localStorage.setItem("piUser", JSON.stringify(sdkUser));
              updateUIForUser(sdkUser);
            } else {
              updateUIForUser(null);
            }
          })
          .catch(() => {
            updateUIForUser(null);
          });
      } else {
        // 3. Pas de session, pas de SDK
        updateUIForUser(null);
      }
    }

    // ─── Bouton VIP ─────────────────────────────────────────────
    const createPaymentBtn = document.getElementById("createPaymentBtn");
    if (createPaymentBtn) {
      createPaymentBtn.addEventListener("click", async function () {
        // Re-vérifie l'utilisateur au moment du clic
        const currentUser = getUserFromStorage();

        if (!currentUser || !currentUser.uid) {
          setPaymentStatus("❌ Please connect with Pi first.", "#ef4444");
          setButtonState(false);
          return;
        }

        setPaymentStatus("⏳ Initiating Pi payment...", "#f59e0b");
        createPaymentBtn.disabled = true;

        try {
          if (
            window.piBrowserPayments &&
            typeof window.piBrowserPayments.initiatePayment === "function"
          ) {
            // Utilise le système de paiement Pi existant
            // Lire amount et memo depuis les inputs
            const amountInput = document.getElementById("payAmount");
            const memoInput = document.getElementById("payMemo");
            const rawAmount = amountInput ? amountInput.value : "0.1";
            const parsedAmount = parseFloat(String(rawAmount).replace(",", "."));
            const memo = memoInput ? memoInput.value : "AtlasPi VIP subscription";

            await window.piBrowserPayments.initiatePayment({
              uid: currentUser.uid,
              username: currentUser.username,
              amount: parsedAmount,
              memo: memo,
            });
          } else {
            // Fallback démo
            console.warn("[PaymentInit] piBrowserPayments not available, using demo flow.");
            await demoPurchaseFlow(currentUser);
          }
        } catch (err) {
          console.error("[PaymentInit] Payment error:", err);
          setPaymentStatus(`❌ Payment failed: ${err.message || "Unknown error"}`, "#ef4444");
          createPaymentBtn.disabled = false;
        }
      });
    }

    // ─── Écoute les événements de login/logout de script.js ─────
    window.addEventListener("piUserLoggedIn", (e) => {
      console.log("[PaymentInit] piUserLoggedIn event received");
      const newUser = e.detail || getUserFromStorage();
      updateUIForUser(newUser);
    });

    window.addEventListener("piUserLoggedOut", () => {
      console.log("[PaymentInit] piUserLoggedOut event received");
      updateUIForUser(null);
    });
  }

  // ─── Demo Flow Fallback ──────────────────────────────────────
  async function demoPurchaseFlow(user) {
    setPaymentStatus("🎭 Demo mode: simulating VIP activation...", "#8b5cf6");

    await new Promise((r) => setTimeout(r, 1500));

    try {
      const API_BASE =
        window.ATLASPI_CONFIG?.API_BASE_URL ||
        "https://atlaspi-backend.onrender.com";

      const resp = await fetch(`${API_BASE}/api/vip/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          username: user.username,
          demo: true,
          paymentId: "demo_" + Date.now(),
        }),
      });

      const data = await resp.json();

      if (data.ok || data.success) {
        setPaymentStatus("🎉 VIP activated! (Demo)", "#10b981");
      } else {
        setPaymentStatus("⚠️ Demo activation returned: " + (data.message || "unknown"), "#f59e0b");
      }
    } catch (err) {
      setPaymentStatus("⚠️ Demo flow completed (backend unreachable)", "#f59e0b");
    }

    const btn = document.getElementById("createPaymentBtn");
    if (btn) btn.disabled = false;
  }

  // ─── Démarrage ───────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
