import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * POST /api/pirc2/services/create
 * Create a local PiRC2 service definition
 * Protected by admin secret
 */
router.post("/create", (req, res) => {
  try {
    const adminSecret = process.env.ADMIN_SECRET || "atlaspi-dev-secret-change-in-prod";
    const headerSecret = req.headers["x-admin-secret"];

    if (!headerSecret || headerSecret !== adminSecret) {
      logger.warn("PiRC2 service create rejected: invalid or missing admin secret");
      return res.status(403).json({
        ok: false,
        error: "Unauthorized. Invalid or missing admin secret."
      });
    }

    const {
      contract_service_id,
      service_code,
      name,
      description,
      price_amount,
      price_currency,
      period_secs,
      trial_period_secs,
      approve_periods,
      is_active,
      visibility_level,
      feature_flags_json
    } = req.body;

    if (!service_code || !name || !price_amount || !period_secs) {
      return res.status(400).json({
        ok: false,
        error: "service_code, name, price_amount and period_secs are required"
      });
    }

    const now = new Date().toISOString();

    db.run(
      `INSERT INTO subscription_services
       (contract_service_id, service_code, name, description, price_amount, price_currency, period_secs,
        trial_period_secs, approve_periods, is_active, visibility_level, feature_flags_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contract_service_id || null,
        service_code,
        name,
        description || "",
        price_amount,
        price_currency || "PI",
        period_secs,
        trial_period_secs || 0,
        approve_periods || 1,
        is_active === false ? 0 : 1,
        visibility_level || "basic",
        feature_flags_json ? JSON.stringify(feature_flags_json) : null,
        now,
        now
      ],
      function (err) {
        if (err) {
          logger.error("PiRC2 service create DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while creating PiRC2 service"
          });
        }

        return res.json({
          ok: true,
          message: "PiRC2 service created successfully",
          service: {
            id: this.lastID,
            contract_service_id: contract_service_id || null,
            service_code,
            name,
            price_amount,
            price_currency: price_currency || "PI",
            period_secs,
            trial_period_secs: trial_period_secs || 0,
            approve_periods: approve_periods || 1,
            is_active: is_active === false ? 0 : 1,
            visibility_level: visibility_level || "basic",
            created_at: now
          }
        });
      }
    );
  } catch (error) {
    logger.error("PiRC2 service create route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pirc2/services/list
 * Public list of PiRC2 services
 */
router.get("/list", (req, res) => {
  db.all(
    `SELECT
      id,
      contract_service_id,
      service_code,
      name,
      description,
      price_amount,
      price_currency,
      period_secs,
      trial_period_secs,
      approve_periods,
      is_active,
      visibility_level,
      feature_flags_json,
      created_at,
      updated_at
     FROM subscription_services
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        logger.error("PiRC2 services list DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading PiRC2 services"
        });
      }

      const services = (rows || []).map((row) => ({
        ...row,
        feature_flags_json: row.feature_flags_json
          ? JSON.parse(row.feature_flags_json)
          : null
      }));

      return res.json({
        ok: true,
        count: services.length,
        services
      });
    }
  );
});

/**
 * GET /api/pirc2/services/:id
 * Get one PiRC2 service by local id
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT
      id,
      contract_service_id,
      service_code,
      name,
      description,
      price_amount,
      price_currency,
      period_secs,
      trial_period_secs,
      approve_periods,
      is_active,
      visibility_level,
      feature_flags_json,
      created_at,
      updated_at
     FROM subscription_services
     WHERE id = ?`,
    [id],
    (err, row) => {
      if (err) {
        logger.error("PiRC2 service detail DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading PiRC2 service"
        });
      }

      if (!row) {
        return res.status(404).json({
          ok: false,
          error: "PiRC2 service not found"
        });
      }

      return res.json({
        ok: true,
        service: {
          ...row,
          feature_flags_json: row.feature_flags_json
            ? JSON.parse(row.feature_flags_json)
            : null
        }
      });
    }
  );
});

export default router;