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
      merchants: rows
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
