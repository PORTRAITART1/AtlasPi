// frontend/pi-browser-payments.js
// Handles real Pi SDK payments — no demo mode

class PiBrowserPayments {
  constructor() {
    this.sdkReady = false;
    this.mode = "production"; // default
    this.init();
  }

  async init() {
    try {
      // Fetch backend mode
      const res = await fetch("/api/mode");
      if (res.ok) {
        const data = await res.json();
        this.mode = data.mode || "production";
      }
    } catch (e) {
      console.warn("[PiBrowserPayments] Could not fetch mode:", e);
    }

    this.sdkReady = typeof Pi !== "undefined";
    console.log(`[PiBrowserPayments] SDK ready: ${this.sdkReady}, mode: ${this.mode}`);
  }

  isInPiBrowser() {
    return typeof Pi !== "undefined";
  }

  async authenticate() {
    if (!this.isInPiBrowser()) {
      console.warn("[PiBrowserPayments] Not in Pi Browser");
      return null;
    }

    return new Promise((resolve, reject) => {
      Pi.authenticate(
        ["payments", "username"],
        (incompletePayment) => {
          console.warn("[PiBrowserPayments] Incomplete payment:", incompletePayment);
        }
      ).then((auth) => {
        console.log("[PiBrowserPayments] Auth success:", auth);
        resolve(auth);
      }).catch((err) => {
        console.error("[PiBrowserPayments] Auth failed:", err);
        reject(err);
      });
    });
  }

  async createPayment(amount, memo, metadata = {}) {
    if (!this.isInPiBrowser()) {
      console.error("[PiBrowserPayments] Pi SDK not available");
      throw new Error("Pi SDK not available. Please open in Pi Browser.");
    }

    // Ensure amount is a proper float
    const parsedAmount = parseFloat(
      String(amount).replace(",", ".")
    );

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    console.log(`[PiBrowserPayments] Creating payment: ${parsedAmount} Pi — "${memo}"`);

    return new Promise((resolve, reject) => {
      Pi.createPayment(
        {
          amount: parsedAmount,
          memo: memo,
          metadata: metadata,
        },
        {
          // Called when payment is ready
          onReadyForServerApproval: async (paymentId) => {
            console.log("[PiBrowserPayments] Ready for approval:", paymentId);
            try {
              const res = await fetch("/api/payments/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });
              if (!res.ok) throw new Error("Approval failed");
              console.log("[PiBrowserPayments] Payment approved");
            } catch (err) {
              console.error("[PiBrowserPayments] Approval error:", err);
              reject(err);
            }
          },

          // Called when payment is ready to complete
          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log("[PiBrowserPayments] Ready for completion:", paymentId, txid);
            try {
              const res = await fetch("/api/payments/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });
              if (!res.ok) throw new Error("Completion failed");
              const data = await res.json();
              console.log("[PiBrowserPayments] Payment completed:", data);
              resolve({ paymentId, txid, data });
            } catch (err) {
              console.error("[PiBrowserPayments] Completion error:", err);
              reject(err);
            }
          },

          // Called on cancellation
          onCancel: (paymentId) => {
            console.warn("[PiBrowserPayments] Payment cancelled:", paymentId);
            reject(new Error("Payment cancelled by user"));
          },

          // Called on error
          onError: (error, payment) => {
            console.error("[PiBrowserPayments] Payment error:", error, payment);
            reject(error);
          },
        }
      );
    });
  }
}

// Export global instance
window.PiBrowserPayments = PiBrowserPayments;
window.piBrowserPayments = new PiBrowserPayments();