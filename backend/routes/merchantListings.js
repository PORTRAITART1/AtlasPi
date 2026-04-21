import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

router.get("/list", (req, res) => {
  db.all(
    `SELECT
      id,
      listing_uuid,
      listing_public_name,
      business_name,
      profile_type,
      domain,
      category,
      country,
      city,
      accepts_pi,
      merchant_pi_wallet,
      merchant_pi_payments_enabled,
      listing_status,
      verification_status,
      created_at
     FROM merchant_listings
     WHERE listing_status = "approved"
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        logger.error("Merchant listings list DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading merchant listings"
        });
      }

      return res.json({
        ok: true,
        count: rows.length,
        listings: rows
      });
    }
  );
});

router.get("/detail/:id", (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT
      id,
      listing_uuid,
      listing_public_name,
      business_name,
      profile_type,
      domain,
      category,
      country,
      city,
      district,
      address_line_1,
      location_link,
      phone_business,
      whatsapp_business,
      email_business,
      website_url,
      merchant_pi_wallet,
      merchant_pi_payments_enabled,
      accepts_pi,
      owner_display_name,
      public_description_short,
      public_description_full,
      products_services_summary,
      visibility_phone,
      visibility_whatsapp,
      visibility_email,
      visibility_website,
      visibility_wallet,
      visibility_district,
      visibility_address,
      visibility_location_link,
      visibility_owner_name,
      listing_status,
      verification_status,
      created_at,
      updated_at,
      consent_terms,
      consent_privacy,
      consent_public_display
     FROM merchant_listings WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        logger.error("Merchant listing detail DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading merchant listing detail"
        });
      }

      if (!row) {
        return res.status(404).json({
          ok: false,
          error: "Merchant listing not found"
        });
      }

      if (row.listing_status !== "approved") {
        logger.warn(`Attempt to view non-approved listing ${id} (status: ${row.listing_status})`);
        return res.status(404).json({
          ok: false,
          error: "Merchant listing not found or not yet approved"
        });
      }

      return res.json({
        ok: true,
        listing: row
      });
    }
  );
});

router.post("/create", (req, res) => {
  try {
    const {
      owner_user_id,
      listing_public_name,
      profile_type,
      business_name,
      brand_name,
      owner_display_name,
      public_description_short,
      public_description_full,
      domain,
      category,
      sub_category,
      products_services_summary,
      products_services_detailed,
      keywords,
      country,
      region,
      city,
      district,
      address_line_1,
      address_line_2,
      postal_code,
      latitude,
      longitude,
      location_link,
      access_instructions,
      phone_business,
      whatsapp_business,
      email_business,
      website_url,
      merchant_pi_wallet,
      merchant_pi_payments_enabled,
      accepts_pi,
      pi_description,
      visibility_district,
      visibility_address,
      visibility_location_link,
      visibility_phone,
      visibility_whatsapp,
      visibility_email,
      visibility_wallet,
      visibility_owner_name,
      visibility_website,
      consent_terms,
      consent_privacy,
      consent_public_display,
      terms_version_accepted,
      privacy_version_accepted,
      listing_policy_version_accepted
    } = req.body;

    if (
      !owner_user_id ||
      !listing_public_name ||
      !profile_type ||
      !business_name ||
      !public_description_short ||
      !domain ||
      !category ||
      !products_services_summary ||
      !country ||
      !city
    ) {
      logger.error("Merchant listing creation failed: missing required fields");
      return res.status(400).json({
        ok: false,
        error: "Missing required merchant listing fields"
      });
    }

    const hasContact =
      (phone_business && phone_business.trim()) ||
      (whatsapp_business && whatsapp_business.trim()) ||
      (email_business && email_business.trim());

    if (!hasContact) {
      logger.error("Merchant listing creation failed: no contact provided");
      return res.status(400).json({
        ok: false,
        error: "At least one professional contact is required"
      });
    }

    if (!consent_terms || !consent_privacy || !consent_public_display) {
      logger.error("Merchant listing creation failed: required agreements not accepted");
      return res.status(400).json({
        ok: false,
        error: "Terms of Use, Privacy Policy and Public Display Authorization must be accepted"
      });
    }

    if (merchant_pi_payments_enabled && (!merchant_pi_wallet || !merchant_pi_wallet.trim())) {
      logger.error("Merchant listing creation failed: Pi wallet missing while Pi payments enabled");
      return res.status(400).json({
        ok: false,
        error: "Merchant Pi Wallet is required when Pi payments are enabled"
      });
    }

    const listingUuid = uuidv4();
    const now = new Date().toISOString();

    const consent_data_accuracy = 1;
    const consent_publication_rights = 1;
    const consent_third_party_rights = 1;
    const consent_listing_policy = 1;
    const consent_review_and_moderation = 1;
    const consent_legal_cooperation_notice = 1;
    const consent_terms_db = 1;
    const consent_privacy_db = 1;
    const consent_public_display_db = 1;

    const columns = [
      "listing_uuid",
      "owner_user_id",
      "listing_public_name",
      "profile_type",
      "business_name",
      "brand_name",
      "owner_display_name",
      "public_description_short",
      "public_description_full",
      "domain",
      "category",
      "sub_category",
      "products_services_summary",
      "products_services_detailed",
      "keywords",
      "country",
      "region",
      "city",
      "district",
      "address_line_1",
      "address_line_2",
      "postal_code",
      "latitude",
      "longitude",
      "location_link",
      "access_instructions",
      "phone_business",
      "whatsapp_business",
      "email_business",
      "website_url",
      "merchant_pi_wallet",
      "merchant_pi_payments_enabled",
      "accepts_pi",
      "pi_description",
      "visibility_district",
      "visibility_address",
      "visibility_location_link",
      "visibility_phone",
      "visibility_whatsapp",
      "visibility_email",
      "visibility_wallet",
      "visibility_owner_name",
      "visibility_website",
      "verification_status",
      "verification_badge_public",
      "consent_data_accuracy",
      "consent_publication_rights",
      "consent_third_party_rights",
      "consent_terms",
      "consent_privacy",
      "consent_listing_policy",
      "consent_public_display",
      "consent_review_and_moderation",
      "consent_legal_cooperation_notice",
      "consent_timestamp",
      "terms_version_accepted",
      "privacy_version_accepted",
      "listing_policy_version_accepted",
      "listing_status",
      "created_at",
      "updated_at",
      "submitted_at"
    ];

    const values = [
      listingUuid,
      owner_user_id,
      listing_public_name,
      profile_type,
      business_name,
      brand_name || "",
      owner_display_name || "",
      public_description_short,
      public_description_full || "",
      domain,
      category,
      sub_category || "",
      products_services_summary,
      products_services_detailed || "",
      keywords || "",
      country,
      region || "",
      city,
      district || "",
      address_line_1 || "",
      address_line_2 || "",
      postal_code || "",
      latitude || null,
      longitude || null,
      location_link || "",
      access_instructions || "",
      phone_business || "",
      whatsapp_business || "",
      email_business || "",
      website_url || "",
      merchant_pi_wallet || "",
      merchant_pi_payments_enabled ? 1 : 0,
      accepts_pi ? 1 : 0,
      pi_description || "",
      visibility_district || "members_only",
      visibility_address || "private",
      visibility_location_link || "members_only",
      visibility_phone || "members_only",
      visibility_whatsapp || "members_only",
      visibility_email || "members_only",
      visibility_wallet || "members_only",
      visibility_owner_name || "private",
      visibility_website || "public",
      "pending",
      "none",
      consent_data_accuracy,
      consent_publication_rights,
      consent_third_party_rights,
      consent_terms_db,
      consent_privacy_db,
      consent_listing_policy,
      consent_public_display_db,
      consent_review_and_moderation,
      consent_legal_cooperation_notice,
      now,
      terms_version_accepted || "v1",
      privacy_version_accepted || "v1",
      listing_policy_version_accepted || "v1",
      "pending_review",
      now,
      now,
      now
    ];

    const placeholders = values.map(() => "?").join(", ");

    db.run(
      `INSERT INTO merchant_listings (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
      function (err) {
        if (err) {
          logger.error("Merchant listing DB insert error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while creating merchant listing"
          });
        }

        logger.info(`Merchant listing created: ${listingUuid}`);

        return res.json({
          ok: true,
          message: "Merchant listing created successfully",
          listing: {
            id: this.lastID,
            listing_uuid: listingUuid,
            listing_public_name,
            business_name,
            city,
            country,
            merchant_pi_wallet: merchant_pi_wallet || "",
            merchant_pi_payments_enabled: merchant_pi_payments_enabled ? 1 : 0,
            listing_status: "pending_review",
            verification_status: "pending"
          }
        });
      }
    );
  } catch (error) {
    logger.error("Merchant listing route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/search", (req, res) => {
  const { name, domain, category, country, city } = req.query;

  let query = `SELECT
      id,
      listing_uuid,
      listing_public_name,
      business_name,
      profile_type,
      domain,
      category,
      country,
      city,
      accepts_pi,
      merchant_pi_wallet,
      merchant_pi_payments_enabled,
      listing_status,
      verification_status,
      created_at
     FROM merchant_listings
     WHERE listing_status = "approved"`;

  const params = [];

  if (name) {
    query += ` AND (listing_public_name LIKE ? OR business_name LIKE ?)`;
    const searchName = `%${name}%`;
    params.push(searchName, searchName);
  }

  if (domain) {
    query += ` AND domain LIKE ?`;
    params.push(`%${domain}%`);
  }

  if (category) {
    query += ` AND category LIKE ?`;
    params.push(`%${category}%`);
  }

  if (country) {
    query += ` AND country LIKE ?`;
    params.push(`%${country}%`);
  }

  if (city) {
    query += ` AND city LIKE ?`;
    params.push(`%${city}%`);
  }

  query += ` ORDER BY id DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error("Merchant search DB error: " + err.message);
      return res.status(500).json({
        ok: false,
        error: "Database error while searching merchant listings"
      });
    }

    return res.json({
      ok: true,
      count: rows ? rows.length : 0,
      listings: rows || []
    });
  });
});

router.put("/update/:id", (req, res) => {
  const { id } = req.params;

  const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
  const headerSecret = req.headers["x-admin-secret"];
  const isAdmin = headerSecret && headerSecret === adminSecret;

  const demoUserId = req.headers["x-demo-user-id"];
  const demoAccessToken = req.headers["x-demo-access-token"];

  if (!isAdmin && (!demoUserId || !demoAccessToken)) {
    logger.warn(`Update attempt rejected: missing demo auth headers for listing ${id}`);
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Admin secret or valid demo user authentication required."
    });
  }

  if (!isAdmin) {
    db.get(
      `SELECT uid FROM auth_logs WHERE uid = ? AND access_token = ?`,
      [demoUserId, demoAccessToken],
      (err, authRow) => {
        if (err) {
          logger.error("Update auth verification DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while verifying authentication"
          });
        }

        if (!authRow) {
          logger.warn(`Update attempt rejected: invalid demo credentials for user ${demoUserId}`);
          return res.status(403).json({
            ok: false,
            error: "Unauthorized. Invalid or expired demo authentication."
          });
        }

        db.get(
          `SELECT owner_user_id FROM merchant_listings WHERE id = ?`,
          [id],
          (err, row) => {
            if (err) {
              logger.error("Update authorization DB error: " + err.message);
              return res.status(500).json({
                ok: false,
                error: "Database error while checking ownership"
              });
            }

            if (!row) {
              return res.status(404).json({
                ok: false,
                error: "Merchant listing not found"
              });
            }

            if (row.owner_user_id !== demoUserId) {
              logger.warn(`Update attempt rejected: user ${demoUserId} is not owner of listing ${id}`);
              return res.status(403).json({
                ok: false,
                error: "Unauthorized. You are not the owner of this listing."
              });
            }

            performUpdate(req, res, id);
          }
        );
      }
    );
    return;
  }

  performUpdate(req, res, id);
});

function performUpdate(req, res, id) {
  const {
    listing_public_name,
    business_name,
    public_description_short,
    domain,
    category,
    products_services_summary,
    country,
    city,
    district,
    address_line_1,
    location_link,
    owner_display_name,
    phone_business,
    whatsapp_business,
    email_business,
    website_url,
    merchant_pi_wallet,
    merchant_pi_payments_enabled,
    accepts_pi,
    visibility_phone,
    visibility_whatsapp,
    visibility_email,
    visibility_website,
    visibility_wallet
  } = req.body;

  if (!id) {
    logger.error("Merchant update failed: missing id");
    return res.status(400).json({
      ok: false,
      error: "Merchant listing ID is required"
    });
  }

  const now = new Date().toISOString();

  const updates = [];
  const values = [];

  if (listing_public_name !== undefined) {
    updates.push("listing_public_name = ?");
    values.push(listing_public_name);
  }

  if (business_name !== undefined) {
    updates.push("business_name = ?");
    values.push(business_name);
  }

  if (public_description_short !== undefined) {
    updates.push("public_description_short = ?");
    values.push(public_description_short);
  }

  if (domain !== undefined) {
    updates.push("domain = ?");
    values.push(domain);
  }

  if (category !== undefined) {
    updates.push("category = ?");
    values.push(category);
  }

  if (products_services_summary !== undefined) {
    updates.push("products_services_summary = ?");
    values.push(products_services_summary);
  }

  if (country !== undefined) {
    updates.push("country = ?");
    values.push(country);
  }

  if (city !== undefined) {
    updates.push("city = ?");
    values.push(city);
  }

  if (district !== undefined) {
    updates.push("district = ?");
    values.push(district);
  }

  if (address_line_1 !== undefined) {
    updates.push("address_line_1 = ?");
    values.push(address_line_1);
  }

  if (location_link !== undefined) {
    updates.push("location_link = ?");
    values.push(location_link);
  }

  if (owner_display_name !== undefined) {
    updates.push("owner_display_name = ?");
    values.push(owner_display_name);
  }

  if (phone_business !== undefined) {
    updates.push("phone_business = ?");
    values.push(phone_business);
  }

  if (whatsapp_business !== undefined) {
    updates.push("whatsapp_business = ?");
    values.push(whatsapp_business);
  }

  if (email_business !== undefined) {
    updates.push("email_business = ?");
    values.push(email_business);
  }

  if (website_url !== undefined) {
    updates.push("website_url = ?");
    values.push(website_url);
  }

  if (merchant_pi_wallet !== undefined) {
    updates.push("merchant_pi_wallet = ?");
    values.push(merchant_pi_wallet);
  }

  if (merchant_pi_payments_enabled !== undefined) {
    updates.push("merchant_pi_payments_enabled = ?");
    values.push(merchant_pi_payments_enabled ? 1 : 0);
  }

  if (accepts_pi !== undefined) {
    updates.push("accepts_pi = ?");
    values.push(accepts_pi ? 1 : 0);
  }

  if (visibility_phone !== undefined) {
    updates.push("visibility_phone = ?");
    values.push(visibility_phone);
  }

  if (visibility_whatsapp !== undefined) {
    updates.push("visibility_whatsapp = ?");
    values.push(visibility_whatsapp);
  }

  if (visibility_email !== undefined) {
    updates.push("visibility_email = ?");
    values.push(visibility_email);
  }

  if (visibility_website !== undefined) {
    updates.push("visibility_website = ?");
    values.push(visibility_website);
  }

  if (visibility_wallet !== undefined) {
    updates.push("visibility_wallet = ?");
    values.push(visibility_wallet);
  }

  updates.push("updated_at = ?");
  values.push(now);

  values.push(id);

  if (updates.length === 1) {
    logger.error("Merchant update failed: no fields to update");
    return res.status(400).json({
      ok: false,
      error: "No fields provided for update"
    });
  }

  db.run(
    `UPDATE merchant_listings SET ${updates.join(", ")} WHERE id = ?`,
    values,
    function (err) {
      if (err) {
        logger.error("Merchant update DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while updating merchant listing"
        });
      }

      if (this.changes === 0) {
        logger.error("Merchant update failed: listing not found");
        return res.status(404).json({
          ok: false,
          error: "Merchant listing not found"
        });
      }

      logger.info(`Merchant listing updated: ${id}`);

      return res.json({
        ok: true,
        message: "Merchant listing updated successfully",
        id
      });
    }
  );
}

router.get("/pending", (req, res) => {
  const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
  const headerSecret = req.headers["x-admin-secret"];

  if (!headerSecret || headerSecret !== adminSecret) {
    logger.warn(`Pending listings access rejected: invalid or missing secret`);
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Invalid or missing admin secret."
    });
  }

  db.all(
    `SELECT
      id,
      listing_uuid,
      listing_public_name,
      business_name,
      profile_type,
      domain,
      category,
      country,
      city,
      accepts_pi,
      merchant_pi_wallet,
      merchant_pi_payments_enabled,
      listing_status,
      moderation_reason,
      verification_status,
      created_at
     FROM merchant_listings
     WHERE listing_status IN ("pending_review", "rejected", "suspended")
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        logger.error("Pending listings DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading pending listings"
        });
      }

      logger.info(`Admin fetched ${rows ? rows.length : 0} pending listings`);

      return res.json({
        ok: true,
        count: rows ? rows.length : 0,
        listings: rows || []
      });
    }
  );
});

router.post("/moderate/:id", (req, res) => {
  const { id } = req.params;
  const { listing_status, moderation_reason } = req.body;

  const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
  const headerSecret = req.headers["x-admin-secret"];

  if (!headerSecret || headerSecret !== adminSecret) {
    logger.warn(`Moderation attempt rejected: invalid or missing secret for listing ${id}`);
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Invalid or missing admin secret."
    });
  }

  const validStatuses = ["pending_review", "approved", "rejected", "suspended"];

  if (!id) {
    logger.error("Moderation failed: missing id");
    return res.status(400).json({
      ok: false,
      error: "Merchant listing ID is required"
    });
  }

  if (!listing_status || !validStatuses.includes(listing_status)) {
    logger.error(`Moderation failed: invalid status "${listing_status}"`);
    return res.status(400).json({
      ok: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
    });
  }

  const now = new Date().toISOString();
  const reason = moderation_reason && moderation_reason.trim() ? moderation_reason.trim() : null;

  // Get current status first
  db.get(
    `SELECT listing_status FROM merchant_listings WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        logger.error("Moderation DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while checking listing"
        });
      }

      if (!row) {
        logger.error("Moderation failed: listing not found");
        return res.status(404).json({
          ok: false,
          error: "Merchant listing not found"
        });
      }

      const previousStatus = row.listing_status;

      // Update listing status
      db.run(
        `UPDATE merchant_listings SET listing_status = ?, moderation_reason = ?, updated_at = ? WHERE id = ?`,
        [listing_status, reason, now, id],
        function (err) {
          if (err) {
            logger.error("Moderation update DB error: " + err.message);
            return res.status(500).json({
              ok: false,
              error: "Database error while updating listing status"
            });
          }

          // Record history
          db.run(
            `INSERT INTO moderation_history (listing_id, previous_status, new_status, moderation_reason, moderated_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, previousStatus, listing_status, reason, "admin", now],
            (histErr) => {
              if (histErr) {
                logger.error("Moderation history DB error: " + histErr.message);
                // Don't fail the moderation, just log the error
              } else {
                logger.info(`Moderation history recorded for listing ${id}: ${previousStatus} → ${listing_status}`);
              }

              logger.info(`Merchant listing #${id} status changed to: ${listing_status}${reason ? " with reason: " + reason : ""}`);

              return res.json({
                ok: true,
                message: `Listing status changed to "${listing_status}"`,
                id,
                listing_status,
                moderation_reason: reason,
                previous_status: previousStatus
              });
            }
          );
        }
      );
    }
  );
});

// Get moderation history for a listing
router.get("/moderation-history/:id", (req, res) => {
  const { id } = req.params;
  const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
  const headerSecret = req.headers["x-admin-secret"];

  if (!headerSecret || headerSecret !== adminSecret) {
    logger.warn(`Moderation history access rejected: invalid or missing secret for listing ${id}`);
    return res.status(403).json({
      ok: false,
      error: "Unauthorized. Invalid or missing admin secret."
    });
  }

  db.all(
    `SELECT
      id,
      listing_id,
      previous_status,
      new_status,
      moderation_reason,
      moderated_by,
      created_at
     FROM moderation_history
     WHERE listing_id = ?
     ORDER BY created_at DESC`,
    [id],
    (err, rows) => {
      if (err) {
        logger.error("Moderation history DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading moderation history"
        });
      }

      logger.info(`Admin fetched ${rows ? rows.length : 0} history entries for listing ${id}`);

      return res.json({
        ok: true,
        listing_id: id,
        count: rows ? rows.length : 0,
        history: rows || []
      });
    }
  );
});

export default router;
