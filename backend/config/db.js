const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'atlaspi.db');
console.log("📦 SQLite DB path:", dbPath);

const db = new Database(dbPath);

// Activer les foreign keys
db.pragma('foreign_keys = ON');

// ============================================
// CRÉATION DES TABLES
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_payment_id TEXT UNIQUE,
    pi_payment_id TEXT,
    txid TEXT,
    uid TEXT,
    username TEXT,
    amount REAL,
    memo TEXT,
    status TEXT,
    metadata TEXT,
    created_at TEXT,
    updated_at TEXT
  )
`);

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

// Ajoute d'autres tables si nécessaires (auth_logs, notifications, etc.)
// Pour simplifier, on crée uniquement l'essentiel pour les paiements
console.log("✅ Tables created/verified");

module.exports = db;
