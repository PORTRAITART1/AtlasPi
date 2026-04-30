/**
 * Payment Handler - Attaches event listeners to payment buttons
 * This initializes the payment flow when buttons are clicked
 */

(function() {
  'use strict';

  console.log('[Payment Handler] Initializing...');

  function initPaymentHandlers() {
    const createPaymentBtn = document.getElementById('createPaymentBtn');
    const payAmount = document.getElementById('payAmount');
    const payMemo = document.getElementById('payMemo');
    const paymentStatusEl = document.getElementById('paymentStatus');

    if (!createPaymentBtn) {
      console.warn('[Payment Handler] Create payment button not found');
      return;
    }

    console.log('[Payment Handler] Attaching event listeners...');

    // Create Payment button click handler
    createPaymentBtn.addEventListener('click', async function() {
      try {
        const amount = parseFloat(payAmount.value);
        const memo = payMemo.value || 'AtlasPi Payment';

        if (!amount || amount <= 0) {
          paymentStatusEl.textContent = '❌ Please enter a valid amount';
          paymentStatusEl.style.color = '#ef4444';
          return;
        }

        paymentStatusEl.textContent = '⏳ Processing payment...';
        paymentStatusEl.style.color = '#f59e0b';
        createPaymentBtn.disabled = true;

        console.log('[Payment Handler] Initiating payment:', { amount, memo });

        // Call the payment handler with required metadata
        if (window.piBrowserPayments && typeof window.piBrowserPayments.initiatePayment === 'function') {
          const result = await window.piBrowserPayments.initiatePayment({ 
            amount, 
            memo,
            metadata: {
              app: 'AtlasPi',
              timestamp: new Date().toISOString()
            }
          });
          console.log('[Payment Handler] Payment successful:', result);
          paymentStatusEl.textContent = `✅ Payment Success! ID: ${result.paymentId || 'pending'}`;
          paymentStatusEl.style.color = '#10b981';
          
          // Reset inputs
          payAmount.value = '';
          payMemo.value = '';
        } else {
          throw new Error('Payment handler not available');
        }
      } catch (error) {
        console.error('[Payment Handler] Payment failed:', error);
        paymentStatusEl.textContent = `❌ Payment Failed: ${error.message}`;
        paymentStatusEl.style.color = '#ef4444';
      } finally {
        createPaymentBtn.disabled = false;
      }
    });

    console.log('[Payment Handler] Event listeners attached successfully');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaymentHandlers);
  } else {
    initPaymentHandlers();
  }

  // Also expose a manual init function
  window.initPaymentHandlers = initPaymentHandlers;
})();
