const express = require("express");
const db = require("../config/db.js");
const logger = require("../utils/logger.js");

const router = express.Router();

/**
 * GET /api/merchant-listings/list
 * Retourne la liste des marchands avec coordonnées GPS
 */
router.get("/list", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        id,
        listing_uuid,
        listing_public_name,
        business_name,
        public_description_short,
        category,
        domain,
        city,
        country,
        latitude,
        longitude,
        phone_business,
        email_business,
        website_url,
        accepts_pi,
        verification_status,
        listing_status,
        created_at
      FROM merchant_listings
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND listing_status = 'approved'
      ORDER BY created_at DESC
    `).all();

    logger.info(`[MerchantListings] Returning ${rows.length} merchants`);

    res.json({
      ok: true,
      count: rows.length,
      listings: rows
    });
  } catch (err) {
    logger.error("[MerchantListings] Error:", err.message);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

/**
 * GET /api/merchant-listings/detail/:id
 */
router.get("/detail/:id", (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`SELECT * FROM merchant_listings WHERE id = ? OR listing_uuid = ?`).get(id, id);

    if (!row) {
      return res.status(404).json({ ok: false, error: "Merchant not found" });
    }

    res.json({ ok: true, merchant: row });
  } catch (err) {
    logger.error("[MerchantListings] Detail error:", err.message);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

module.exports = router;

/**
 * POST /api/merchant-listings/create
 * Crée une nouvelle inscription marchand
 */
const { v4: uuidv4 } = require("uuid");

router.post("/create", (req, res) => {
  try {
    const {
      owner_user_id,
      listing_public_name,
      business_name,
      owner_display_name,
      public_description_short,
      domain,
      category,
      products_services_summary,
      country,
      city,
      address_line_1,
      latitude,
      longitude,
      phone_business,
      email_business,
      website_url,
      merchant_pi_wallet,
      merchant_pi_payments_enabled,
      accepts_pi,
      pi_description,
      consent_terms,
      consent_privacy,
      consent_public_display
    } = req.body;

    // Validation minimale
    if (!owner_user_id || !listing_public_name || !business_name || !city || !country) {
      return res.status(400).json({
        ok: false,
        error: "Champs obligatoires manquants : owner_user_id, listing_public_name, business_name, city, country"
      });
    }

    if (!consent_terms || !consent_privacy || !consent_public_display) {
      return res.status(400).json({
        ok: false,
        error: "Tous les consentements sont obligatoires"
      });
    }

    const now = new Date().toISOString();
    const listingUuid = uuidv4();

    db.prepare(`
      INSERT INTO merchant_listings (
        listing_uuid, owner_user_id, listing_public_name, profile_type,
        business_name, owner_display_name, public_description_short,
        domain, category, products_services_summary,
        country, city, address_line_1, latitude, longitude,
        phone_business, email_business, website_url,
        accepts_pi, pi_description,
        verification_status, verification_badge_public,
        consent_data_accuracy, consent_publication_rights, consent_third_party_rights,
        consent_terms, consent_privacy, consent_listing_policy,
        consent_public_display, consent_review_and_moderation,
        consent_legal_cooperation_notice, consent_timestamp,
        terms_version_accepted, privacy_version_accepted, listing_policy_version_accepted,
        listing_status, merchant_pi_wallet, merchant_pi_payments_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      listingUuid,
      owner_user_id,
      listing_public_name,
      "business",
      business_name,
      owner_display_name || listing_public_name,
      public_description_short || "",
      domain || "Services",
      category || "Autre",
      products_services_summary || public_description_short || "",
      country,
      city,
      address_line_1 || null,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      phone_business || null,
      email_business || null,
      website_url || null,
      accepts_pi ? 1 : 0,
      pi_description || null,
      "pending",
      "none",
      1, 1, 1, 1, 1, 1, 1, 1, 1,
      now,
      "1.0", "1.0", "1.0",
      "pending_review",
      merchant_pi_wallet || null,
      merchant_pi_payments_enabled ? 1 : 0,
      now, now
    );

    logger.info(`✅ [MerchantListings] New listing created: ${listingUuid}`);

    res.status(201).json({
      ok: true,
      message: "Merchant listing created successfully. En attente de modération.",
      listing_uuid: listingUuid,
      status: "pending_review"
    });

  } catch (err) {
    logger.error("[MerchantListings] Create error:", err.message);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});
