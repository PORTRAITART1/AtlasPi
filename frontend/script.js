document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const piStatus = document.getElementById("piStatus");
  const piConnectBtn = document.getElementById("piConnectBtn");
  const piUsername = document.getElementById("piUsername");
  const piWallet = document.getElementById("piWallet");
  const createPaymentBtn = document.getElementById("createPaymentBtn");
  const payAmount = document.getElementById("payAmount");
  const payMemo = document.getElementById("payMemo");
  const paymentStatusElement = document.getElementById("paymentStatus"); // Added for payment status display

  // --- Global Variables ---
  // Assuming API_BASE_URL is globally available or loaded from config
  const API_BASE_URL = window.ATLASPI_CONFIG?.API_BASE_URL || 'http://localhost:3000'; 
  let currentUser = null;
  let currentPayment = { localPaymentId: null, paymentId: null, txid: null }; // State for demo payment flow
  let editingMerchantId = null;

  // --- Initialization ---
  // piIntegrationManager and piBrowserPayments are initialized globally in their respective files
  const piManager = window.piIntegrationManager;
  const piPaymentHandler = window.piBrowserPayments; // Use the new payment handler

  // Auth handler uses the global piManager
  const authHandler = new AtlasPiAuthHandler(piManager); 

  // --- Helper Functions ---

  // Function to update the UI with Pi integration status
  function updatePiStatusUI() {
    if (!piStatus || !piConnectBtn || !piUsername || !piWallet) return;

    const authStatus = piManager.getAuthStatus();
    const paymentStatusMsg = piPaymentHandler.getStatusMessage(); // Message from the payment handler

    piStatus.textContent = authStatus.statusMessage; // General integration status
    
    // Display the payment status
    if (paymentStatusElement) {
      paymentStatusElement.textContent = paymentStatusMsg;
      // Set color based on status (e.g., green for ready, yellow/red for warnings)
      if (paymentStatusMsg.includes('Ready') || paymentStatusMsg.includes('DEMO')) {
        paymentStatusElement.style.color = "#10b981"; // Green
      } else if (paymentStatusMsg.includes('⚠️')) {
        paymentStatusElement.style.color = "#eab308"; // Yellow
      } else {
        paymentStatusElement.style.color = "#dc2626"; // Red
      }
    }

    // Display user info if authenticated
    if (authStatus.user) {
      piUsername.textContent = authStatus.user.username;
      piWallet.textContent = authStatus.user.wallet_address || "-";
      piConnectBtn.style.display = 'none'; // Hide connect button if logged in
    } else {
      piUsername.textContent = "-";
      piWallet.textContent = "-";
      piConnectBtn.style.display = 'block'; // Show connect button if not logged in
    }

    // Manage payment button states
    if (createPaymentBtn) {
      createPaymentBtn.disabled = false; // Always enabled to trigger the flow
      // Dynamically change button text based on detected mode
      const isPiRealMode = piPaymentHandler.getMode() === 'pi-browser-real';
      createPaymentBtn.textContent = isPiRealMode ? "Initiate Real Pi Payment" : "Initiate Demo Payment";
    }
  }

  // Function to update the payment status message in the UI
  function updatePaymentStatus(message, isError) {
    if (paymentStatusElement) {
      paymentStatusElement.textContent = message;
      paymentStatusElement.style.color = isError ? "#dc2626" : "#10b981"; // Red for error, green for success
    }
  }

  // --- Backend Status Check ---
  async function checkBackendStatus() {
    // ... (existing backend status check logic - assumed unchanged)
    // This function should ideally call piManager.setBackendMode() after a successful check
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        const data = await response.json();
        console.log("Backend health check:", data);
        // Update the Pi integration manager with the mode reported by the backend
        if (piManager && data.mode) {
          piManager.setBackendMode(data.mode);
        }
      } else {
        console.error("Backend health check failed:", response.status);
        // Set a default or error mode if backend is down
        if (piManager) {
          piManager.setBackendMode('demo'); // Fallback to demo if backend is unreachable
        }
      }
    } catch (error) {
      console.error("Error during backend health check:", error);
      if (piManager) {
        piManager.setBackendMode('demo'); // Fallback to demo on network error
      }
    }
  }

  // --- Authentication ---
  async function connectDemoPiUser() {
    if (!piStatus) return;

    piStatus.textContent = "⏳ Sending login request to backend...";

    try {
      // Use the global manager for authentication
      const authResult = await piManager.authenticate(); 

      if (authResult.ok) {
        // Update UI with connection status and user info
        const statusText = authResult.fallbackMode 
          ? `✅ Connected in DEMO (fallback from ${authResult.fallbackMode.toUpperCase()})`
          : `✅ Authenticated in ${authResult.mode.toUpperCase()} mode.`;
        piStatus.textContent = statusText;
        
        if (piUsername) piUsername.textContent = authStatus.user.username;
        if (piWallet) piWallet.textContent = authStatus.user.wallet_address || "-";
        
        updatePiStatusUI(); // Refresh UI elements

      } else {
        piStatus.textContent = `❌ Auth error: ${authResult.error || "Unknown error"}`;
      }
    } catch (error) {
      piStatus.textContent = "❌ Failed to contact backend for Pi auth.";
      console.error("Auth connection error:", error);
    }
  }

  // --- Payment Handling ---

  // Encapsulates the old demo payment flow logic
  // This function will be called by piBrowserPayments.js when in demo fallback mode
  window.triggerDemoPaymentFlow = async (paymentConfig, resolve, reject) => {
    console.log("[Demo Payment Flow] Initiated with config:", paymentConfig);
    const { amount, memo } = paymentConfig;

    try {
      // 1. Create payment record on backend (using the renamed route)
      const createResponse = await fetch(`${API_BASE_URL}/api/payments/create-record-day3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: piManager.getUser()?.uid || 'guest', // Use authenticated user ID or guest
          username: piManager.getUser()?.username || 'GuestUser',
          amount: amount,
          memo: memo,
          metadata: { source: 'demo-fallback' }
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create demo payment record: ${createResponse.status}`);
      }
      const createData = await createResponse.json();
      currentPayment.localPaymentId = createData.localPaymentId;
      updatePaymentStatus(`⏳ Demo payment created (ID: ${createData.localPaymentId.substring(0,8)}...). Waiting for mock approval...`, false);

      // 2. Simulate backend approval (mock)
      // In a real app, this might involve a user action or a delay
      await new Promise(res => setTimeout(res, 1000)); // Simulate delay
      const mockApprovalData = { ok: true, paymentId: createData.localPaymentId, status: 'approved', message: 'Demo approval successful' };
      console.log("Mock approval data:", mockApprovalData);
      updatePaymentStatus(`✅ Demo payment approved. Waiting for mock completion...`, false);

      // 3. Simulate completion (mock)
      // In a real app, this would involve user confirmation and txid generation
      await new Promise(res => setTimeout(res, 1000)); // Simulate delay
      const mockTxid = `mock-txid-${uuidv4().substring(0, 8)}`;
      const mockCompletionData = { ok: true, paymentId: createData.localPaymentId, txid: mockTxid, status: 'completed', message: 'Demo completion successful' };
      console.log("Mock completion data:", mockCompletionData);
      
      // Resolve the promise that initiatePayment is waiting for
      resolve({
        success: true,
        paymentId: createData.localPaymentId, // Use local ID for demo
        txid: mockTxid,
        message: 'Demo payment completed successfully.',
        mode: 'demo-fallback'
      });
      updatePaymentStatus(`✅ Demo payment completed! (TXID: ${mockTxid})`, false);

    } catch (error) {
      console.error("Demo payment flow error:", error);
      updatePaymentStatus(`❌ Demo payment failed: ${error.message}`, true);
      reject(error); // Reject the promise
    }
  };

  // Main handler for the payment button click
  async function handlePaymentCreation() {
    if (!payAmount || !payMemo) {
      console.error("Payment input elements not found!");
      return;
    }

    const amount = payAmount.value.trim();
    const memo = payMemo.value.trim();

    if (!amount || Number(amount) <= 0) {
      updatePaymentStatus("❌ Please enter a valid amount.", true);
      return;
    }

    const paymentConfig = { amount, memo };
    
    updatePaymentStatus("⏳ Processing payment...", false);

    try {
      // Use the piBrowserPayments handler which decides between real Pi or demo flow
      const result = await piPaymentHandler.initiatePayment(paymentConfig);

      if (result.success) {
        updatePaymentStatus(`✅ Payment successful! ${result.message} (TXID: ${result.txid || 'N/A'})`, false);
        // Reset payment state after success
        currentPayment = { localPaymentId: null, paymentId: null, txid: null };
      } else {
        // Error message should be in result.message from the handler
        updatePaymentStatus(`❌ Payment failed: ${result.message}`, true);
      }
    } catch (error) {
      updatePaymentStatus(`❌ Payment error: ${error.message}`, true);
      console.error("Payment initiation error:", error);
    }
  }

  // --- Event Listeners ---
  if (piConnectBtn) {
    piConnectBtn.addEventListener("click", connectDemoPiUser);
  }
  if (createPaymentBtn) {
    createPaymentBtn.addEventListener("click", handlePaymentCreation);
  }

  // ... (loadPaymentsList, loadMerchantListings, etc. - assumed unchanged)

  // --- Initial Load ---
  checkBackendStatus(); // Check backend status first to set the mode correctly
  
  // Update UI after a short delay to allow managers to initialize and backend status to be checked
  setTimeout(() => {
    updatePiStatusUI();
    // loadMerchantListings(); // Uncomment if this should be called on load
  }, 500); 
});
