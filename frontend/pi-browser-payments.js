// frontend/pi-browser-payments.js

const BACKEND_URL = "https://atlaspi-backend.onrender.com";

class PiBrowserPayments {
  constructor() {
    this.sdkReady = false;
    this.init();
  }

  async init() {
    this.sdkReady = typeof Pi !== "undefined";
    console.log(`[PiBrowserPayments] SDK ready: ${this.sdkReady}`);
  }

  isInPiBrowser() {
    return typeof Pi !== "undefined";
  }

  async authenticate() {
    if (!this.isInPiBrowser()) return null;
    try {
      const auth = await Pi.authenticate(
        ["username", "payments"],
        async (incompletePayment) => {
          if (incompletePayment) {
            console.warn("[PiBrowserPayments] Incomplete payment:", incompletePayment.identifier);
            try {
              await fetch(`${BACKEND_URL}/api/pi-payments/complete-pi-real`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: incompletePayment.identifier,
                  txid: incompletePayment.transaction?.txid || "incomplete"
                }),
              });
            } catch (e) {
              console.error("[PiBrowserPayments] Incomplete handle error:", e);
            }
          }
        }
      );
      return auth;
    } catch (err) {
      throw err;
    }
  }

  // ✅ NOUVELLE SIGNATURE : accepte un objet callbacks en 4ème paramètre
  async createPayment(amount, memo, metadata = {}, callbacks = {}) {
    if (!this.isInPiBrowser()) {
      throw new Error("Pi SDK not available. Please open in Pi Browser.");
    }

    const parsedAmount = parseFloat(String(amount).replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    await this.authenticate();

    console.log(`[PiBrowserPayments] Creating payment: ${parsedAmount} Pi`);

    return new Promise((resolve, reject) => {
      Pi.createPayment(
        { amount: parsedAmount, memo: memo, metadata: metadata },
        {
          onReadyForServerApproval: async (paymentId) => {
            console.log("[PiBrowserPayments] onReadyForServerApproval:", paymentId);
            if (callbacks.onApproving) callbacks.onApproving(paymentId);

            try {
              const res = await fetch(`${BACKEND_URL}/api/pi-payments/approve-pi-real`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });
              const data = await res.json().catch(() => ({}));

              if (!res.ok) {
                console.error("[PiBrowserPayments] Approval error:", res.status, data);
                if (callbacks.onError) callbacks.onError(new Error(data.error || `HTTP ${res.status}`));
              } else {
                console.log("[PiBrowserPayments] Approved ✅");
                if (callbacks.onApproved) callbacks.onApproved(paymentId, data);
              }
            } catch (err) {
              console.error("[PiBrowserPayments] Approval fetch error:", err);
              if (callbacks.onError) callbacks.onError(err);
            }
          },

          onReadyForServerCompletion: async (paymentId, txid) => {
            console.log("[PiBrowserPayments] onReadyForServerCompletion:", paymentId, txid);
            if (callbacks.onCompleting) callbacks.onCompleting(paymentId, txid);

            try {
              const res = await fetch(`${BACKEND_URL}/api/pi-payments/complete-pi-real`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });
              const data = await res.json().catch(() => ({}));

              if (!res.ok) {
                throw new Error(data.error || `Complete failed: ${res.status}`);
              }

              console.log("[PiBrowserPayments] Completed ✅");
              if (callbacks.onCompleted) callbacks.onCompleted(paymentId, txid, data);
              resolve({ paymentId, txid, data });

            } catch (err) {
              console.error("[PiBrowserPayments] Completion error:", err);
              if (callbacks.onError) callbacks.onError(err);
              reject(err);
            }
          },

          onCancel: (paymentId) => {
            console.warn("[PiBrowserPayments] Cancelled:", paymentId);
            if (callbacks.onCancel) callbacks.onCancel(paymentId);
            reject(new Error("Payment cancelled by user"));
          },

          onError: (error, payment) => {
            console.error("[PiBrowserPayments] Error:", error);
            if (callbacks.onError) callbacks.onError(error);
            reject(error);
          },
        }
      );
    });
  }
}

window.PiBrowserPayments = PiBrowserPayments;
window.piBrowserPayments = new PiBrowserPayments();
