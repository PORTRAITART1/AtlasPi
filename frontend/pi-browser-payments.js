// frontend/pi-browser-payments.js
// Handles real Pi SDK payments only

const BACKEND_URL = "https://atlaspi-backend.onrender.com";

class PiBrowserPayments {
  constructor() {
    this.sdkReady = false;
    this.mode = "production";
    this.init();
  }

  async init() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/mode`);
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
      try {
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
      } catch (err) {
        console.error("[PiBrowserPayments] Auth exception:", err);
        reject(err);
      }
    });
  }

  async createPayment(amount, memo, metadata = {}) {
    if (!this.isInPiBrowser()) {
      console.error("[PiBrowserPayments] Pi SDK not available");
      throw new Error("Pi SDK not available. Please open in Pi Browser.");
    }

    const parsedAmount = parseFloat(String(amount).replace(",", "."));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

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
          onReadyForServerApproval: async (paymentId) => {
            console.log("[PiBrowserPayments] Ready for approval:", paymentId);
            try {
              const res = await fetch(`${BACKEND_URL}/api/pi/approve`, {
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

          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log("[PiBrowserPayments] Ready for completion:", paymentId, txid);
            try {
              const res = await fetch(`${BACKEND_URL}/api/pi/complete`, {
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

          onCancel: (paymentId) => {
            console.warn("[PiBrowserPayments] Payment cancelled:", paymentId);
            reject(new Error("Payment cancelled by user"));
          },

          onError: (error, payment) => {
            console.error("[PiBrowserPayments] Payment error:", error, payment);
            reject(error);
          },
        }
      );
    });
  }
}

window.PiBrowserPayments = PiBrowserPayments;
window.piBrowserPayments = new PiBrowserPayments();
