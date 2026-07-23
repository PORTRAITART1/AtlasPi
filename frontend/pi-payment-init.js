/**
 * pi-payment-init.js
 * Gère l'état du bouton VIP, la détection de session,
 * et le déclenchement du paiement Pi.
 */

 (function () {
  "use strict";

  // ─── Helpers ──────────────────────────────────────────────────
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

  // ─── UI Update ────────────────────────────────────────────────
  function updateUIForUser(user) {
    if (user && user.uid) {
      setPaymentStatus("✅ Ready to activate VIP.", "#10b981");
      setButtonState(true);
      fillMerchantUID(user.uid);

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

  // ─── Silent Auth via Pi SDK ───────────────────────────────────
  function trySilentAuth() {
    return new Promise((resolve) => {
      // ✅ FIX: Vérifie juste Pi et authenticate, sans _piSdkReady
      if (
        window.Pi &&
        typeof window.Pi.authenticate === "function"
      ) {
        console.log("[PaymentInit] Trying Pi SDK silent auth...");

        // ✅ FIX: Callback direct, pas dans un objet
        window.Pi.authenticate(
          ["username", "payments"],
          (incompletePayment) => {
            console.warn("[PaymentInit] Incomplete payment found:", incompletePayment);
          }
        )
          .then((authResult) => {
            if (authResult && authResult.user) {
              const sdkUser = {
                uid: authResult.user.uid,
                username: authResult.user.username,
              };
              localStorage.setItem("piUser", JSON.stringify(sdkUser));
              console.log("[PaymentInit] SDK auth success:", sdkUser.username);
              resolve(sdkUser);
            } else {
              resolve(null);
            }
          })
          .catch((err) => {
            console.warn("[PaymentInit] SDK auth failed:", err);
            resolve(null);
          });
      } else {
        console.log("[PaymentInit] Pi SDK not available");
        resolve(null);
      }
    });
  }

  // ─── Payment Handler ──────────────────────────────────────────
  async function handlePaymentClick() {
    const createPaymentBtn = document.getElementById("createPaymentBtn");
    const currentUser = getUserFromStorage();

    if (!currentUser || !currentUser.uid) {
      setPaymentStatus("❌ Please connect with Pi first.", "#ef4444");
      setButtonState(false);
      return;

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      console.error("[PaymentInit] Invalid amount:", rawAmount);
      setPaymentStatus("⚠️ Invalid amount: " + rawAmount, "#ef4444");
      return;
    }

    const memo = memoInput
      ? memoInput.value.trim() || "AtlasPi VIP subscription"
      : "AtlasPi VIP subscription";

    setPaymentStatus("⏳ Initiating Pi payment...", "#f59e0b");
    if (createPaymentBtn) createPaymentBtn.disabled = true;

    try {
      const payments = window.piBrowserPayments;

      if (payments && typeof payments.createPayment === "function") {
        // ✅ FIX: Appel correct avec la bonne signature
        console.log(`[PaymentInit] Calling createPayment(${parsedAmount}, "${memo}")`);
        await payments.createPayment(
          parsedAmount,
          memo,
          {
            uid: currentUser.uid,
            username: currentUser.username,
            type: "vip_activation",
          },
          {
            onReadyForServerApproval: function(paymentId) {
              console.log("[PaymentInit] Server approval ready:", paymentId);
            },
            onReadyForServerCompletion: function(paymentId, txid) {
              console.log("[PaymentInit] Payment completed:", paymentId, txid);
              setPaymentStatus("🎉 VIP activated successfully!", "#10b981");
              const btn = document.getElementById("createPaymentBtn");
              if (btn) {
                btn.textContent = "✅ VIP Active";
                btn.disabled = true;
              }
            },
            onCancel: function(paymentId) {
              console.log("[PaymentInit] Payment cancelled:", paymentId);
              setPaymentStatus("❌ Payment cancelled.", "#6b7280");
              const btn = document.getElementById("createPaymentBtn");
              if (btn) btn.disabled = false;
            },
            onError: function(error, paymentId) {
              console.error("[PaymentInit] Payment error:", error, paymentId);
              setPaymentStatus(`❌ Payment failed: ${error.message || "Unknown error"}`, "#ef4444");
              const btn = document.getElementById("createPaymentBtn");
              if (btn) btn.disabled = false;
            }
          }
        );
        if (createPaymentBtn) {
          createPaymentBtn.textContent = "✅ VIP Active";
          createPaymentBtn.disabled = true;
        }

      } else {
        console.error("[PaymentInit] Pi payment SDK unavailable");

        setPaymentStatus(
          "❌ Pi payment system is not available. Please open AtlasPi inside Pi Browser and try again.",
          "#ef4444"
        );

        if (createPaymentBtn) createPaymentBtn.disabled = false;
        return;
      }

    } catch (err) {
      console.error("[PaymentInit] Payment error:", err);

      if (err.message && err.message.toLowerCase().includes("cancel")) {
        setPaymentStatus("❌ Payment cancelled.", "#6b7280");
      } else {
        setPaymentStatus(`❌ Payment failed: ${err.message || "Unknown error"}`, "#ef4444");
      }

      if (createPaymentBtn) createPaymentBtn.disabled = false;
    }
  }
// ─── Init ─────────────────────────────────────────────────────
  async function init() {
    // 1. Vérifie localStorage en premier
    let user = getUserFromStorage();

    if (user) {
      console.log("[PaymentInit] User found in localStorage:", user.username);
      updateUIForUser(user);
    } else {
      // 2. Tente silent auth Pi SDK
      user = await trySilentAuth();
      updateUIForUser(user);
    }

    // 3. Attache le bouton VIP
    const createPaymentBtn = document.getElementById("createPaymentBtn");
    if (createPaymentBtn) {
      createPaymentBtn.addEventListener("click", handlePaymentClick);
    }

    // 4. Écoute login/logout depuis script.js
    window.addEventListener("piUserLoggedIn", (e) => {
      console.log("[PaymentInit] piUserLoggedIn received");
      const newUser = e.detail || getUserFromStorage();
      updateUIForUser(newUser);
    });

    window.addEventListener("piUserLoggedOut", () => {
      console.log("[PaymentInit] piUserLoggedOut received");
      updateUIForUser(null);
    });

    console.log("[PaymentInit] Init complete");
  }

  // ─── Démarrage ────────────────────────────────────────────────
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
})();

