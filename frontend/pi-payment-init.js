/**
 * AtlasPi Pi Payment Initialization
 * 
 * Implements the OFFICIAL 3-phase Pi payment flow:
 * PHASE I: Server approval
 * PHASE II: Blockchain transaction + user signature
 * PHASE III: Server completion
 * 
 * This file connects the UI buttons to the real PiBrowserPayments module
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('[Pi Payment Init] Initializing payment system...');

  // Initialize Pi Payments
  const payments = window.piBrowserPayments;
  
  // Set API base URL
  if (window.API_BASE) {
    payments.apiBase = window.API_BASE;
  }

  console.log('[Pi Payment Init] SDK Available:', payments.isSdkAvailable());
  console.log('[Pi Payment Init] Status Message:', payments.getStatusMessage());

  // Update UI to show SDK status
  const paymentStatusDiv = document.getElementById('paymentStatus');
  if (paymentStatusDiv) {
    paymentStatusDiv.textContent = payments.getStatusMessage();
    paymentStatusDiv.style.padding = '12px';
    paymentStatusDiv.style.backgroundColor = payments.isSdkAvailable() ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)';
    paymentStatusDiv.style.borderLeft = payments.isSdkAvailable() ? '3px solid #22c55e' : '3px solid #eab308';
    paymentStatusDiv.style.borderRadius = '4px';
  }

  // Handle "Create Payment Record" button click
  const createPaymentBtn = document.getElementById('createPaymentBtn');
  if (createPaymentBtn) {
    createPaymentBtn.addEventListener('click', async function() {
      const amount = document.getElementById('payAmount').value;
      const memo = document.getElementById('payMemo').value;

      if (!amount || parseFloat(amount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      if (!payments.isSdkAvailable()) {
        alert('Pi SDK not available. This app must run in Pi Browser to process payments.');
        return;
      }

      console.log('[Payment Button] Creating payment:', { amount, memo });
      
      try {
        // Update UI: show loading state
        createPaymentBtn.disabled = true;
        createPaymentBtn.textContent = 'Creating payment... Follow Pi Browser popup';

        // Call the official 3-phase payment flow
        const result = await payments.initiatePayment({
          amount,
          memo: memo || 'AtlasPi payment'
        });

        console.log('[Payment Button] Payment successful:', result);

        // Update UI: show success
        const paymentStatusDiv = document.getElementById('paymentStatus');
        if (paymentStatusDiv) {
          paymentStatusDiv.textContent = `✅ Payment completed successfully!
PaymentID: ${result.paymentId}
TxID: ${result.txid}
Status: ${result.message}`;
          paymentStatusDiv.style.backgroundColor = 'rgba(34,197,94,0.2)';
          paymentStatusDiv.style.borderLeftColor = '#22c55e';
        }

        // Clear form
        document.getElementById('payAmount').value = '';
        document.getElementById('payMemo').value = '';

      } catch (error) {
        console.error('[Payment Button] Payment error:', error);

        const paymentStatusDiv = document.getElementById('paymentStatus');
        if (paymentStatusDiv) {
          paymentStatusDiv.textContent = `❌ Payment failed: ${error.message}
Reason: Make sure you sign the transaction in Pi Browser when prompted.`;
          paymentStatusDiv.style.backgroundColor = 'rgba(239,68,68,0.1)';
          paymentStatusDiv.style.borderLeftColor = '#ef4444';
        }

      } finally {
        createPaymentBtn.disabled = false;
        createPaymentBtn.textContent = 'Create Payment Record';
      }
    });
  }

  // Hide old "Approve" and "Complete" buttons - they're handled by the SDK now
  const approveBtn = document.getElementById('approvePaymentBtn');
  const completeBtn = document.getElementById('completePaymentBtn');
  
  if (approveBtn) {
    approveBtn.style.display = 'none';
  }
  if (completeBtn) {
    completeBtn.style.display = 'none';
  }

  // Add info text about the 3-phase flow
  const paymentDemoCard = document.querySelector('[id="app-demo"] .feature-card:nth-child(3)');
  if (paymentDemoCard) {
    const infoDiv = document.createElement('div');
    infoDiv.style.marginTop = '16px';
    infoDiv.style.padding = '12px';
    infoDiv.style.backgroundColor = 'rgba(59,130,246,0.1)';
    infoDiv.style.borderRadius = '4px';
    infoDiv.style.borderLeft = '3px solid #3b82f6';
    infoDiv.style.fontSize = '13px';
    infoDiv.innerHTML = `
      <strong>How it works:</strong>
      <ol style="margin: 8px 0 0 20px;">
        <li><strong>Phase I:</strong> Click "Create Payment Record"</li>
        <li><strong>Phase II:</strong> Sign the transaction in Pi Wallet/Browser</li>
        <li><strong>Phase III:</strong> Payment completes automatically</li>
      </ol>
      <p style="margin: 8px 0 0 0; font-style: italic;">⚠️ This requires Pi Browser SDK. Open this page in Pi Browser.</p>
    `;
    
    const paymentStatus = document.getElementById('paymentStatus');
    if (paymentStatus && paymentStatus.parentNode) {
      paymentStatus.parentNode.insertBefore(infoDiv, paymentStatus.nextSibling);
    }
  }

  console.log('[Pi Payment Init] System initialized successfully');
});
