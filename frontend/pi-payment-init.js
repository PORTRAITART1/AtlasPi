/**
 * pi-payment-init.js - Gère l'état du bouton VIP et le déclenchement du paiement Pi
 */

(function () {
  "use strict";

  function getUserFromStorage() {
    try {
      const raw = localStorage.getItem("piUser");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) return parsed;
      return null;
    } catch (e) { return null; }
  }

  function setPaymentStatus(msg, color) {
    const el = document.getElementById("paymentStatus");
    if (el) {
      el.textContent = msg;
      el.style.color = color || "#6b7280";
      console.log("[PaymentInit] Status:", msg);
    }
  }

  function setButtonState(enabled) {
    const btn = document.getElementById("createPaymentBtn");
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "1" : "0.5";
    btn.style.cursor = enabled ? "pointer" : "not-allowed";
  }

  function updateUIForUser(user) {
    if (user && user.uid) {
      setPaymentStatus("✅ Ready to activate VIP.", "#10b981");
      setButtonState(true);

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

  function trySilentAuth() {
    return new Promise((resolve) => {
      if (window.Pi && typeof window.Pi.authenticate === "function") {
        window.Pi.authenticate(["username", "payments"], () => {})
          .then((result) => {
            if (result && result.user) {
              const u = { uid: result.user.uid, username: result.user.username };
              localStorage.setItem("piUser", JSON.stringify(u));
              resolve(u);
            } else resolve(null);
          })
          .catch(() => resolve(null));
      } else resolve(null);
    });
  }

  async function handlePaymentClick() {
    const btn = document.getElementById("createPaymentBtn");
    const currentUser = getUserFromStorage();

    if (!currentUser || !currentUser.uid) {
      setPaymentStatus("❌ Please connect with Pi first.", "#ef4444");
      setButtonState(false);
      return;
    }

    const amountInput = document.getElementById("payAmount");
    const memoInput = document.getElementById("payMemo");
    const rawAmount = amountInput ? amountInput.value.trim() : "0.1";
    const parsedAmount = parseFloat(rawAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPaymentStatus("⚠️ Invalid amount", "#ef4444");
      return;
    }

    const memo = memoInput ? memoInput.value.trim() || "AtlasPi VIP subscription" : "AtlasPi VIP subscription";

    setPaymentStatus("⏳ Initiating Pi payment...", "#f59e0b");
    if (btn) btn.disabled = true;

    try {
      const payments = window.piBrowserPayments;
      if (!payments || typeof payments.createPayment !== "function") {
        setPaymentStatus("❌ Pi payment system unavailable.", "#ef4444");
        if (btn) btn.disabled = false;
        return;
      }

      console.log("[PaymentInit] Calling createPayment with callbacks...");

      // ✅ APPEL AVEC CALLBACKS DIRECTS
      await payments.createPayment(
        parsedAmount,
        memo,
        { uid: currentUser.uid, username: currentUser.username, type: "vip_activation" },
        {
          onApproving: () => {
            setPaymentStatus("⏳ Approbation du paiement...", "#f59e0b");
          },
          onApproved: () => {
            setPaymentStatus("⏳ Paiement approuvé. Confirmez dans Pi...", "#3b82f6");
          },
          onCompleting: () => {
            setPaymentStatus("⏳ Finalisation du paiement...", "#3b82f6");
          },
          onCompleted: () => {
            setPaymentStatus("🎉 VIP activé avec succès !", "#10b981");
            if (btn) {
              btn.textContent = "✅ VIP Active";
              btn.disabled = true;
              btn.style.opacity = "1";
            }
          },
          onCancel: () => {
            setPaymentStatus("❌ Paiement annulé.", "#6b7280");
            if (btn) btn.disabled = false;
          },
          onError: (err) => {
            setPaymentStatus(`❌ Erreur : ${err.message || "Inconnue"}`, "#ef4444");
            if (btn) btn.disabled = false;
          }
        }
      );

    } catch (err) {
      console.error("[PaymentInit] Error:", err);
      if (err.message && err.message.toLowerCase().includes("cancel")) {
        setPaymentStatus("❌ Paiement annulé.", "#6b7280");
      } else {
        setPaymentStatus(`❌ Erreur : ${err.message || "Inconnue"}`, "#ef4444");
      }
      if (btn) btn.disabled = false;
    }
  }

  async function init() {
    let user = getUserFromStorage();
    if (user) {
      updateUIForUser(user);
    } else {
      user = await trySilentAuth();
      updateUIForUser(user);
    }

    const btn = document.getElementById("createPaymentBtn");
    if (btn) {
      // Éviter les doublons d'écouteurs
      btn.replaceWith(btn.cloneNode(true));
      const newBtn = document.getElementById("createPaymentBtn");
      newBtn.addEventListener("click", handlePaymentClick);
    }

    window.addEventListener("piUserLoggedIn", (e) => {
      const u = e.detail || getUserFromStorage();
      updateUIForUser(u);
    });
    window.addEventListener("piUserLoggedOut", () => updateUIForUser(null));

    console.log("[PaymentInit] Init complete");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
