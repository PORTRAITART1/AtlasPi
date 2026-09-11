const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ✅ Détecter le disque persistant /var/data (Render)
const persistentDataDir =
  process.env.SQLITE_DATA_DIR ||
  (fs.existsSync("/var/data") ? "/var/data" : path.join(__dirname, "../data"));

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(persistentDataDir)) {
    fs.mkdirSync(persistentDataDir, { recursive: true });
}

const dbPath = path.join(persistentDataDir, 'atlaspi.db');
console.log("�� SQLite DB path:", dbPath);

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
    updated_at TEXT
  )
`);

console.log("✅ Tables created/verified");

module.exports = db;
