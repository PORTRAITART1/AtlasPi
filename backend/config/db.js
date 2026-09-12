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

// ============================================
// TABLE merchant_listings (pour la carte)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS merchant_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_uuid TEXT NOT NULL UNIQUE,
    owner_user_id TEXT NOT NULL,
    listing_public_name TEXT NOT NULL,
    profile_type TEXT NOT NULL,
    business_name TEXT NOT NULL,
    brand_name TEXT,
    owner_display_name TEXT,
    public_description_short TEXT NOT NULL,
    public_description_full TEXT,
    domain TEXT NOT NULL,
    category TEXT NOT NULL,
    sub_category TEXT,
    products_services_summary TEXT NOT NULL,
    products_services_detailed TEXT,
    keywords TEXT,
    country TEXT NOT NULL,
    region TEXT,
    city TEXT NOT NULL,
    district TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    postal_code TEXT,
    latitude REAL,
    longitude REAL,
    location_link TEXT,
    access_instructions TEXT,
    phone_business TEXT,
    whatsapp_business TEXT,
    email_business TEXT,
    website_url TEXT,
    accepts_pi INTEGER NOT NULL DEFAULT 0,
    pi_description TEXT,
    visibility_district TEXT NOT NULL DEFAULT 'members_only',
    visibility_address TEXT NOT NULL DEFAULT 'private',
    visibility_location_link TEXT NOT NULL DEFAULT 'members_only',
    visibility_phone TEXT NOT NULL DEFAULT 'members_only',
    visibility_whatsapp TEXT NOT NULL DEFAULT 'members_only',
    visibility_email TEXT NOT NULL DEFAULT 'members_only',
    visibility_wallet TEXT NOT NULL DEFAULT 'members_only',
    visibility_owner_name TEXT NOT NULL DEFAULT 'private',
    visibility_website TEXT NOT NULL DEFAULT 'public',
    verification_status TEXT NOT NULL DEFAULT 'pending',
    verification_badge_public TEXT NOT NULL DEFAULT 'none',
    consent_data_accuracy INTEGER NOT NULL DEFAULT 1,
    consent_publication_rights INTEGER NOT NULL DEFAULT 1,
    consent_third_party_rights INTEGER NOT NULL DEFAULT 1,
    consent_terms INTEGER NOT NULL DEFAULT 1,
    consent_privacy INTEGER NOT NULL DEFAULT 1,
    consent_listing_policy INTEGER NOT NULL DEFAULT 1,
    consent_public_display INTEGER NOT NULL DEFAULT 1,
    consent_review_and_moderation INTEGER NOT NULL DEFAULT 1,
    consent_legal_cooperation_notice INTEGER NOT NULL DEFAULT 1,
    consent_timestamp TEXT NOT NULL DEFAULT '',
    terms_version_accepted TEXT NOT NULL DEFAULT '1.0',
    privacy_version_accepted TEXT NOT NULL DEFAULT '1.0',
    listing_policy_version_accepted TEXT NOT NULL DEFAULT '1.0',
    listing_status TEXT NOT NULL DEFAULT 'pending_review',
    merchant_pi_wallet TEXT,
    merchant_pi_payments_enabled INTEGER NOT NULL DEFAULT 0,
    moderation_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT
  )
`);

console.log("✅ merchant_listings table ready");
