const express = require("express");
const db = require("../config/db.js");
const logger = require("../utils/logger.js");
const { v4: uuidv4 } = require("uuid");
const { validateBody, validateQuery } = require("../middlewares/validate.js");
const {
  createPaymentRecordSchema,
  approvePaymentSchema,
  completePaymentSchema,
  userStatusQuerySchema
} = require("../validators/payments.validators.js");

const router = express.Router();

// ✅ Créer les tables si elles n'existent pas
function initTables() {
  try {
    // Table users (avec toutes les colonnes nécessaires)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        wallet_address TEXT,
        is_vip INTEGER NOT NULL DEFAULT 0,
        vip_expires_at TEXT,
        vip_payment_id TEXT,
        vip_txid TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Table payments
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_payment_id TEXT UNIQUE NOT NULL,
        uid TEXT NOT NULL,
        username TEXT,
        amount INTEGER NOT NULL,
        memo TEXT,
        metadata TEXT,
        status TEXT DEFAULT 'pending',
        pi_payment_id TEXT,
        pi_transaction_id TEXT,
        created_at TEXT,
        approved_at TEXT,
        completed_at TEXT,
        FOREIGN KEY (uid) REFERENCES users(uid)
      )
    `);

    // Index pour améliorer les performances
    db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_uid ON payments(uid)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);

    logger.info("✅ Payment tables initialized successfully");
  } catch (error) {
    logger.error("❌ Error initializing payment tables:", error);
  }
}

// Initialiser les tables au chargement
initTables();

/**
 * POST /api/payments/create-record
 * Crée un enregistrement de paiement local
 */
router.post("/create-record", validateBody(createPaymentRecordSchema), async (req, res) => {
  try {
    const { uid, username, amount, memo, metadata } = req.body;

    const localPaymentId = uuidv4();
    const now = new Date().toISOString();

    // Vérifier si l'utilisateur existe déjà
    let user = db.prepare("SELECT * FROM users WHERE uid = ?").get(uid);
    if (!user) {
      // Créer l'utilisateur avec created_at ET updated_at
      const stmt = db.prepare("INSERT INTO users (uid, username, created_at, updated_at) VALUES (?, ?, ?, ?)");
      stmt.run(uid, username, now, now);
    }

    // Créer l'enregistrement de paiement local
    const stmt = db.prepare(`
      INSERT INTO payments 
      (local_payment_id, uid, username, amount, memo, metadata, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    stmt.run(localPaymentId, uid, username, amount, memo, JSON.stringify(metadata), now);

    logger.info(`✅ Payment record created: ${localPaymentId} for user ${uid}`);

    res.status(201).json({
      ok: true,
      localPaymentId,
      status: 'pending',
      message: 'Payment record created successfully'
    });

  } catch (error) {
    logger.error("Error creating payment record:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

/**
 * POST /api/payments/approve
 * Approuve un paiement (côté backend après vérification)
 */
router.post("/approve", validateBody(approvePaymentSchema), async (req, res) => {
  try {
    const { localPaymentId, piPaymentId, status } = req.body;

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE payments 
      SET pi_payment_id = ?, status = ?, approved_at = ?
      WHERE local_payment_id = ? AND status = 'pending'
    `);
    const result = stmt.run(piPaymentId, status, now, localPaymentId);

    if (result.changes === 0) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found or already processed"
      });
    }

    logger.info(`✅ Payment approved: ${localPaymentId} -> ${piPaymentId}`);

    res.json({
      ok: true,
      message: "Payment approved successfully"
    });

  } catch (error) {
    logger.error("Error approving payment:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

/**
 * POST /api/payments/complete
 * Marque un paiement comme complété
 */
router.post("/complete", validateBody(completePaymentSchema), async (req, res) => {
  try {
    const { localPaymentId, piTransactionId } = req.body;

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE payments 
      SET status = 'completed', pi_transaction_id = ?, completed_at = ?
      WHERE local_payment_id = ? AND status IN ('pending', 'approved')
    `);
    const result = stmt.run(piTransactionId, now, localPaymentId);

    if (result.changes === 0) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found or already completed"
      });
    }

    logger.info(`✅ Payment completed: ${localPaymentId} -> ${piTransactionId}`);

    res.json({
      ok: true,
      message: "Payment completed successfully"
    });

  } catch (error) {
    logger.error("Error completing payment:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

/**
 * GET /api/payments/status
 * Récupère le statut d'un paiement
 */
router.get("/status", validateQuery(userStatusQuerySchema), async (req, res) => {
  try {
    const { localPaymentId } = req.query;

    const payment = db.prepare(`
      SELECT * FROM payments WHERE local_payment_id = ?
    `).get(localPaymentId);

    if (!payment) {
      return res.status(404).json({
        ok: false,
        error: "Payment not found"
      });
    }

    res.json({
      ok: true,
      payment: {
        localPaymentId: payment.local_payment_id,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.created_at,
        piPaymentId: payment.pi_payment_id,
        piTransactionId: payment.pi_transaction_id
      }
    });

  } catch (error) {
    logger.error("Error getting payment status:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

/**
 * GET /api/payments/user/:uid
 * Récupère tous les paiements d'un utilisateur
 */
router.get("/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const payments = db.prepare(`
      SELECT * FROM payments WHERE uid = ? ORDER BY created_at DESC
    `).all(uid);

    res.json({
      ok: true,
      payments
    });

  } catch (error) {
    logger.error("Error getting user payments:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

module.exports = router;
