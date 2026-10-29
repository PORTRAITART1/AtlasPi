/**
 * pi-payment-init.js - GÃ¨re l'Ã©tat du bouton VIP et le dÃ©clenchement du paiement Pi
 */

(function () {
  "use strict";

  function getUserFromStorage() {
  function getUserFromStorage() {
    // Conformité Pi : récupérer l'utilisateur depuis le gestionnaire Pi actif
    if (window.piIntegrationManager && typeof window.piIntegrationManager.getUser === "function") {
      const piUser = window.piIntegrationManager.getUser();
      if (piUser && piUser.uid) return piUser;
    }
    if (window.AtlasPiAuthHandler && typeof window.AtlasPiAuthHandler.getUser === "function") {
      const authUser = window.AtlasPiAuthHandler.getUser();
      if (authUser && authUser.uid) return authUser;
    }
    // Fallback pour les tests si l'objet global Pi est accessible
    if (window.Pi && window.Pi.getUser) {
      return window.Pi.getUser();
    }
    return null;
  }
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
      setPaymentStatus("âœ… Ready to activate VIP.", "#10b981");
      setButtonState(true);

      const piConnectBtn = document.getElementById("piConnectBtn");
      if (piConnectBtn) {
        piConnectBtn.textContent = `âœ“ Connected: ${user.username || "User"}`;
        piConnectBtn.disabled = true;
        piConnectBtn.style.opacity = "0.7";
      }
      const piStatus = document.getElementById("piStatus");
      if (piStatus) {
        piStatus.textContent = `âœ… Logged in as ${user.username || user.uid}`;
        piStatus.style.color = "#10b981";
      }
    } else {
      setPaymentStatus("ðŸ” Connect with Pi first to unlock VIP.", "#f59e0b");
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
              // localStorage.setItem("piUser", JSON.stringify(u)); // SUPPRIMÉ - Conformité Pi
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
      setPaymentStatus("âŒ Please connect with Pi first.", "#ef4444");
      setButtonState(false);
      return;
    }

    const amountInput = document.getElementById("payAmount");
    const memoInput = document.getElementById("payMemo");
    const rawAmount = amountInput ? amountInput.value.trim() : "0.1";
    const parsedAmount = parseFloat(rawAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPaymentStatus("âš ï¸ Invalid amount", "#ef4444");
      return;
    }

    const memo = memoInput ? memoInput.value.trim() || "AtlasPi VIP subscription" : "AtlasPi VIP subscription";

    setPaymentStatus("â³ Initiating Pi payment...", "#f59e0b");
    if (btn) btn.disabled = true;

    try {
      const payments = window.piBrowserPayments;
      if (!payments || typeof payments.createPayment !== "function") {
        setPaymentStatus("âŒ Pi payment system unavailable.", "#ef4444");
        if (btn) btn.disabled = false;
        return;
      }

      console.log("[PaymentInit] Calling createPayment with callbacks...");

      // âœ… APPEL AVEC CALLBACKS DIRECTS
      await payments.createPayment(
        parsedAmount,
        memo,
        { uid: currentUser.uid, username: currentUser.username, type: "vip_activation" },
        {
          onApproving: () => {
            setPaymentStatus("â³ Approbation du paiement...", "#f59e0b");
          },
          onApproved: () => {
            setPaymentStatus("â³ Paiement approuvÃ©. Confirmez dans Pi...", "#3b82f6");
          },
          onCompleting: () => {
            setPaymentStatus("â³ Finalisation du paiement...", "#3b82f6");
          },
          onCompleted: () => {
            setPaymentStatus("ðŸŽ‰ VIP activÃ© avec succÃ¨s !", "#10b981");
            if (btn) {
              btn.textContent = "âœ… VIP Active";
              btn.disabled = true;
              btn.style.opacity = "1";
            }
          },
          onCancel: () => {
            setPaymentStatus("âŒ Paiement annulÃ©.", "#6b7280");
            if (btn) btn.disabled = false;
          },
          onError: (err) => {
            setPaymentStatus(`âŒ Erreur : ${err.message || "Inconnue"}`, "#ef4444");
            if (btn) btn.disabled = false;
          }
        }
      );

    } catch (err) {
      console.error("[PaymentInit] Error:", err);
      if (err.message && err.message.toLowerCase().includes("cancel")) {
        setPaymentStatus("âŒ Paiement annulÃ©.", "#6b7280");
      } else {
        setPaymentStatus(`âŒ Erreur : ${err.message || "Inconnue"}`, "#ef4444");
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
      // Ã‰viter les doublons d'Ã©couteurs
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




