import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "atlaspi.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

db.serialize(() => {
  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS auth_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT,
      username TEXT,
      wallet_address TEXT,
      access_token TEXT,
      created_at TEXT
    )
  `);

  // Migration: Add access_token column to auth_logs if missing
  db.all(`PRAGMA table_info(auth_logs)`, [], (err, columns) => {
    if (err) {
      console.error("❌ Error checking auth_logs columns:", err.message);
      return;
    }

    const columnNames = columns.map((col) => col.name);

    if (!columnNames.includes("access_token")) {
      db.run(
        `ALTER TABLE auth_logs ADD COLUMN access_token TEXT`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding access_token:", alterErr.message);
          } else {
            console.log("✅ Column added: access_token");
          }
        }
      );
    } else {
      console.log("✅ Column already exists: access_token");
    }
  });

  db.run(`
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
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      submitted_at TEXT
    )
  `);

  db.all(`PRAGMA table_info(merchant_listings)`, [], (err, columns) => {
    if (err) {
      console.error("❌ Error checking merchant_listings columns:", err.message);
      return;
    }

    const columnNames = columns.map((col) => col.name);

    if (!columnNames.includes("merchant_pi_wallet")) {
      db.run(
        `ALTER TABLE merchant_listings ADD COLUMN merchant_pi_wallet TEXT`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding merchant_pi_wallet:", alterErr.message);
          } else {
            console.log("✅ Column added: merchant_pi_wallet");
          }
        }
      );
    }

    if (!columnNames.includes("merchant_pi_payments_enabled")) {
      db.run(
        `ALTER TABLE merchant_listings ADD COLUMN merchant_pi_payments_enabled INTEGER NOT NULL DEFAULT 0`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding merchant_pi_payments_enabled:", alterErr.message);
          } else {
            console.log("✅ Column added: merchant_pi_payments_enabled");
          }
        }
      );
    }

    if (!columnNames.includes("visibility_wallet")) {
      db.run(
        `ALTER TABLE merchant_listings ADD COLUMN visibility_wallet TEXT NOT NULL DEFAULT 'members_only'`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding visibility_wallet:", alterErr.message);
          } else {
            console.log("✅ Column added: visibility_wallet");
          }
        }
      );
    }

    if (!columnNames.includes("moderation_reason")) {
      db.run(
        `ALTER TABLE merchant_listings ADD COLUMN moderation_reason TEXT`,
        (alterErr) => {
          if (alterErr) {
            console.error("❌ Error adding moderation_reason:", alterErr.message);
          } else {
            console.log("✅ Column added: moderation_reason");
          }
        }
      );
    }
  });

  // Moderation History Table
  db.run(`
    CREATE TABLE IF NOT EXISTS moderation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      moderation_reason TEXT,
      moderated_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(listing_id) REFERENCES merchant_listings(id)
    )
  `);

  // Subscriptions Table (DAY 3+ - Subscription Core)
  db.run(`
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
      updated_at TEXT NOT NULL,
      FOREIGN KEY(merchant_listing_id) REFERENCES merchant_listings(id)
    )
  `);
});

export default db;
