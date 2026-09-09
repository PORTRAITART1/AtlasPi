cat > backend/config/db.js << 'EOF'
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
  CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid TEXT,
    username TEXT,
    wallet_address TEXT,
    access_token TEXT,
    created_at TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uid TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    link TEXT,
    icon TEXT DEFAULT '🔔',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

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
    consent_data_accuracy INTEGER NOT NULL,
    consent_publication_rights INTEGER NOT NULL,
    consent_third_party_rights INTEGER NOT NULL,
    consent_terms INTEGER NOT NULL,
    consent_privacy INTEGER NOT NULL,
    consent_listing_policy INTEGER NOT NULL,
    consent_public_display INTEGER NOT NULL,
    consent_review_and_moderation INTEGER NOT NULL,
    consent_legal_cooperation_notice INTEGER NOT NULL,
    consent_timestamp TEXT NOT NULL,
    terms_version_accepted TEXT NOT NULL,
    privacy_version_accepted TEXT NOT NULL,
    listing_policy_version_accepted TEXT NOT NULL,
    listing_status TEXT NOT NULL DEFAULT 'pending_review',
    merchant_pi_wallet TEXT,
    merchant_pi_payments_enabled INTEGER NOT NULL DEFAULT 0,
    moderation_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS moderation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    moderation_reason TEXT,
    moderated_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_uuid TEXT NOT NULL UNIQUE,
    owner_user_id TEXT NOT NULL,
    merchant_listing_id INTEGER,
    plan_code TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PI',
    payment_reference TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_uuid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    support_type TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    source TEXT NOT NULL DEFAULT 'frontend',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscription_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_service_id TEXT UNIQUE,
    service_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price_amount REAL NOT NULL,
    price_currency TEXT NOT NULL DEFAULT 'PI',
    period_secs INTEGER NOT NULL,
    trial_period_secs INTEGER NOT NULL DEFAULT 0,
    approve_periods INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    visibility_level TEXT NOT NULL DEFAULT 'basic',
    feature_flags_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_sub_id TEXT UNIQUE,
    service_id INTEGER NOT NULL,
    subscriber_uid TEXT,
    subscriber_username TEXT,
    subscriber_wallet TEXT,
    merchant_listing_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    auto_renew INTEGER NOT NULL DEFAULT 0,
    pay_upfront INTEGER NOT NULL DEFAULT 0,
    price_amount REAL NOT NULL,
    price_currency TEXT NOT NULL DEFAULT 'PI',
    trial_end_ts TEXT,
    service_end_ts TEXT,
    next_charge_ts TEXT,
    last_contract_sync_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscription_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER,
    contract_sub_id TEXT,
    event_type TEXT NOT NULL,
    event_source TEXT NOT NULL DEFAULT 'backend',
    payload_json TEXT,
    created_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subscription_process_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER,
    contract_service_id TEXT,
    offset_value INTEGER NOT NULL DEFAULT 0,
    limit_value INTEGER NOT NULL DEFAULT 0,
    charged_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    result_json TEXT,
    processed_by TEXT NOT NULL DEFAULT 'backend',
    created_at TEXT NOT NULL
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

console.log("✅ All tables created/verified");

module.exports = db;
EOF