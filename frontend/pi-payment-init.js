/**
 * Pi Browser Payments Integration Patch
 * This file patches script.js to use real Pi Browser SDK payments when available
 */

// This script runs after script.js is loaded
// It patches the payment functions to use the new PiBrowserPayments module

document.addEventListener("DOMContentLoaded", () => {
  // Wait for PiBrowserPayments to be initialized
  const checkPiPaymentsReady = setInterval(() => {
    if (window.PiBrowserPayments) {
      clearInterval(checkPiPaymentsReady);
      initializePiPaymentsPatch();
    }
  }, 100);
}, { once: true });

function initializePiPaymentsPatch() {
  console.log('[Pi Payments Patch] Initializing Pi Browser payments integration...');
  
  // Get references
  const approvePaymentBtn = document.getElementById("approvePaymentBtn");
  const paymentStatus = document.getElementById("paymentStatus");
  const piBrowserPayments = new window.PiBrowserPayments();
  
  // Update button appearance based on SDK availability
  if (approvePaymentBtn) {
    if (piBrowserPayments.isSdkAvailable()) {
      approvePaymentBtn.textContent = '🟢 Approve Payment (Real Pi SDK)';
      approvePaymentBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else {
      approvePaymentBtn.textContent = '🟡 Approve Payment (Demo Mode)';
      approvePaymentBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    }
  }
  
  // Log status
  console.log('[Pi Payments] Status:', piBrowserPayments.getStatus());
  console.log('[Pi Payments] Message:', piBrowserPayments.getStatusMessage());
}
