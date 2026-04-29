document.addEventListener("DOMContentLoaded", () => {
  // ... (initialisation des éléments DOM)

  // Initialiser Pi Integration Manager et Pi Browser Payments
  // piIntegrationManager sera initialisé globalement dans pi-integration.js
  // piBrowserPayments sera initialisé globalement dans pi-browser-payments.js
  const piManager = window.piIntegrationManager;
  const piPaymentHandler = window.piBrowserPayments; // Utiliser le nouveau gestionnaire

  const authHandler = new AtlasPiAuthHandler(piManager); // piManager est maintenant global

  // ... (API_BASE_URL)

  // ... (éléments DOM pour le paiement)

  // ... (currentUser, currentPayment, editingMerchantId)

  // ... (fonctions helper: getStatusBadgeHTML, renderAdminCounters, etc.)

  // ... (gestion du menu, formulaire d'attente)

  async function checkBackendStatus() {
    // ... (inchangé)
  }

  async function connectDemoPiUser() {
    if (!piStatus) return;

    piStatus.textContent = "⏳ Sending demo Pi login to backend...";

    try {
      // Utiliser le manager global pour l'authentification
      const authResult = await piManager.authenticate(); // Appelle authDemo si mode demo ou SDK non dispo

      if (authResult.ok) {
        piStatus.textContent = `✅ ${authResult.mode.toUpperCase()} user connected.`;
        
        // Mettre à jour l'UI avec les infos utilisateur
        if (piUsername) {
          piUsername.textContent = authResult.user.username;
        }
        if (piWallet) {
          piWallet.textContent = authResult.user.wallet_address || "-";
        }
        
        // Mettre à jour le statut global de l'intégration Pi
        updatePiStatusUI();

      } else {
        piStatus.textContent = `❌ Auth error: ${authResult.error || "Unknown error"}`;
      }
    } catch (error) {
      piStatus.textContent = "❌ Failed to contact backend for Pi auth.";
      console.error("Auth connection error:", error);
    }
  }

  // Fonction pour mettre à jour l'UI du statut Pi
  function updatePiStatusUI() {
    if (!piStatus || !piConnectBtn || !piUsername || !piWallet) return;

    const authStatus = piManager.getAuthStatus();
    const paymentStatusMsg = piPaymentHandler.getStatusMessage(); // Message du gestionnaire de paiement

    piStatus.textContent = authStatus.statusMessage; // Message général d'intégration
    
    // Afficher le statut du paiement
    const paymentStatusElement = document.getElementById("paymentStatus"); // Assurez-vous que cet ID existe
    if (paymentStatusElement) {
      paymentStatusElement.textContent = paymentStatusMsg;
    }

    // Afficher les infos utilisateur si authentifié
    if (authStatus.user) {
      piUsername.textContent = authStatus.user.username;
      piWallet.textContent = authStatus.user.wallet_address || "-";
      piConnectBtn.style.display = 'none'; // Cacher le bouton si connecté
    } else {
      piUsername.textContent = "-";
      piWallet.textContent = "-";
      piConnectBtn.style.display = 'block'; // Afficher le bouton si non connecté
    }

    // Gérer l'état des boutons de paiement
    const isDemoMode = piManager.isDemoMode();
    const isPiRealMode = piPaymentHandler.getMode() === 'pi-browser-real';

    // Activer/désactiver les boutons de paiement en fonction du mode
    if (createPaymentBtn) {
      createPaymentBtn.disabled = false; // Toujours activé pour déclencher le flux
      // Optionnel: changer le texte du bouton
      createPaymentBtn.textContent = isPiRealMode ? "Initiate Real Pi Payment" : "Initiate Demo Payment";
    }
    // Les boutons approve/complete sont gérés par le flux démo interne, on les laisse comme ça pour l'instant
    // car le vrai flow Pi gère ses propres phases.
  }

  // ... (fonctions pour les paiements : createPaymentRecord, approvePaymentRecord, completePaymentRecord)
  // Ces fonctions sont pour le flux DÉMO interne. Elles ne seront appelées que si le vrai flow Pi n'est pas utilisé.

  // Modification pour utiliser le nouveau gestionnaire de paiement
  async function handlePaymentCreation() {
    if (!payAmount || !payMemo) return;

    const amount = payAmount.value.trim();
    const memo = payMemo.value.trim();

    if (!amount || Number(amount) <= 0) {
      updatePaymentStatus("❌ Please enter a valid amount.", true);
      return;
    }

    const paymentConfig = { amount, memo };
    const paymentStatusElement = document.getElementById("paymentStatus");

    updatePaymentStatus("⏳ Processing payment...", false);

    try {
      // Utiliser le gestionnaire piBrowserPayments
      const result = await piPaymentHandler.initiatePayment(paymentConfig);

      if (result.success) {
        updatePaymentStatus(`✅ Payment successful! ${result.message} (TXID: ${result.txid || 'N/A'})`, false);
        // Réinitialiser l'état du paiement si nécessaire
        currentPayment = { localPaymentId: null, paymentId: null, txid: null };
      } else {
        updatePaymentStatus(`❌ Payment failed: ${result.message}`, true);
      }
    } catch (error) {
      updatePaymentStatus(`❌ Payment error: ${error.message}`, true);
      console.error("Payment initiation error:", error);
    }
  }

  // Fonction pour mettre à jour le statut du paiement (utilisée par le flux démo ET le nouveau flux)
  function updatePaymentStatus(message, isError) {
    const paymentStatusElement = document.getElementById("paymentStatus");
    if (paymentStatusElement) {
      paymentStatusElement.textContent = message;
      paymentStatusElement.style.color = isError ? "#dc2626" : "#10b981"; // Rouge pour erreur, vert pour succès
    }
  }

  // Remplacer l'ancien gestionnaire de paiement par le nouveau
  if (createPaymentBtn) {
    createPaymentBtn.addEventListener("click", handlePaymentCreation);
  }

  // ... (loadPaymentsList, loadMerchantListings, etc.)

  // Initialisation
  checkBackendStatus();
  // Mettre à jour le statut Pi après la vérification du backend et l'initialisation des managers
  setTimeout(() => {
    updatePiStatusUI();
    loadMerchantListings(); // Charger les listes après initialisation
  }, 500); // Petit délai pour laisser les managers s'initialiser
});
