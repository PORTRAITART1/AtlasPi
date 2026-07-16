// frontend/pi-browser-payments.js
// Handles real Pi SDK payments only

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
        ["username", "payments"],
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
    // Ensure Pi user is authenticated with payments scope before creating payment
    await this.authenticate();

    console.log(`[PiBrowserPayments] Creating payment: ${parsedAmount} Pi — "${memo}"`);

    return new Promise((resolve, reject) => {
      Pi.createPayment(
        {
          amount: parsedAmount,
          memo: memo,
          metadata: metadata,
        },
        {
          // Called when payment is ready for server approval
          onReadyForServerApproval: async (paymentId) => {
            console.log("[PiBrowserPayments] Ready for approval:", paymentId);

            try {
              const res = await fetch("/api/pi-payments/approve-pi-real", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });

              const data = await res.json().catch(() => ({}));

              if (!res.ok || data.success === false) {
                throw new Error(data.message || data.error || "Approval failed");
              }

              console.log("[PiBrowserPayments] Payment approved:", data);
            } catch (err) {
              console.error("[PiBrowserPayments] Approval error:", err);
              reject(err);
            }
          },

          // Called when payment is ready for server completion
          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log("[PiBrowserPayments] Ready for completion:", paymentId, txid);

            try {
              const res = await fetch("/api/pi-payments/complete-pi-real", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });

              const data = await res.json().catch(() => ({}));

              if (!res.ok || data.success === false) {
                throw new Error(data.message || data.error || "Completion failed");
              }

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
