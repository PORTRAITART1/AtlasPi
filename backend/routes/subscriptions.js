/**
 * AtlasPi Subscriptions Routes (Subscription Core - DAY 3+)
 * 
 * Simple local subscription management
 * NOTE: This is a DAY 3+ implementation without Smart Contracts
 * Full PiRC2 compliance requires blockchain integration (future)
 */

import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

/**
 * POST /api/subscriptions/create
 * Create a new subscription
 */
router.post("/create", (req, res) => {
  try {
    const {
      owner_user_id,
      merchant_listing_id,
      plan_code,
      plan_name,
      billing_cycle,
      amount,
      currency
    } = req.body;

    // Validate required fields
    if (!owner_user_id || !plan_code || !plan_name || !amount) {
      logger.error("Subscription creation failed: missing required fields");
      return res.status(400).json({
        ok: false,
        error: "owner_user_id, plan_code, plan_name, and amount are required"
      });
    }

    // Validate billing cycle
    const validCycles = ['monthly', 'quarterly', 'yearly', 'weekly'];
    if (billing_cycle && !validCycles.includes(billing_cycle)) {
      logger.error(`Subscription creation failed: invalid billing_cycle ${billing_cycle}`);
      return res.status(400).json({
        ok: false,
        error: `billing_cycle must be one of: ${validCycles.join(', ')}`
      });
    }

    const subscriptionUuid = uuidv4();
    const now = new Date().toISOString();
    const cycle = billing_cycle || 'monthly';
    const curr = currency || 'PI';
    const merchantId = merchant_listing_id || null;
    const startDate = new Date().toISOString();

    db.run(
      `INSERT INTO subscriptions
       (subscription_uuid, owner_user_id, merchant_listing_id, plan_code, plan_name, 
        status, billing_cycle, amount, currency, start_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscriptionUuid,
        owner_user_id,
        merchantId,
        plan_code,
        plan_name,
        'active',
        cycle,
        amount,
        curr,
        startDate,
        now,
        now
      ],
      function (err) {
        if (err) {
          logger.error("Subscription create DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while creating subscription"
          });
        }

        logger.info(`Subscription created: ${subscriptionUuid} for user ${owner_user_id}`);

        return res.json({
          ok: true,
          subscription: {
            id: this.lastID,
            subscription_uuid: subscriptionUuid,
            owner_user_id,
            merchant_listing_id: merchantId,
            plan_code,
            plan_name,
            status: 'active',
            billing_cycle: cycle,
            amount,
            currency: curr,
            start_date: startDate,
            created_at: now
          }
        });
      }
    );
  } catch (error) {
    logger.error("Subscription create error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * GET /api/subscriptions/list
 * List all subscriptions (with optional owner filter)
 */
router.get("/list", (req, res) => {
  try {
    const { owner_user_id } = req.query;

    let query = `SELECT 
      id,
      subscription_uuid,
      owner_user_id,
      merchant_listing_id,
      plan_code,
      plan_name,
      status,
      billing_cycle,
      amount,
      currency,
      payment_reference,
      start_date,
      end_date,
      created_at,
      updated_at
     FROM subscriptions
     WHERE 1=1`;

    const params = [];

    if (owner_user_id) {
      query += ` AND owner_user_id = ?`;
      params.push(owner_user_id);
    }

    query += ` ORDER BY id DESC`;

    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error("Subscriptions list DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while listing subscriptions"
        });
      }

      return res.json({
        ok: true,
        count: rows ? rows.length : 0,
        subscriptions: rows || [],
        note: "Subscription Core (DAY 3+) - Smart Contracts pending"
      });
    });
  } catch (error) {
    logger.error("Subscriptions list error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * GET /api/subscriptions/:id
 * Get subscription details
 */
router.get("/:id", (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Subscription ID is required"
      });
    }

    db.get(
      `SELECT 
        id,
        subscription_uuid,
        owner_user_id,
        merchant_listing_id,
        plan_code,
        plan_name,
        status,
        billing_cycle,
        amount,
        currency,
        payment_reference,
        start_date,
        end_date,
        created_at,
        updated_at
       FROM subscriptions
       WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) {
          logger.error("Subscription detail DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while loading subscription"
          });
        }

        if (!row) {
          return res.status(404).json({
            ok: false,
            error: "Subscription not found"
          });
        }

        return res.json({
          ok: true,
          subscription: row,
          note: "Subscription Core (DAY 3+) - Smart Contracts pending"
        });
      }
    );
  } catch (error) {
    logger.error("Subscription detail error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/subscriptions/update/:id
 * Update subscription status or details
 */
router.put("/update/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status, end_date, payment_reference } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "Subscription ID is required"
      });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'active', 'expired', 'cancelled', 'paused'];
    if (status && !validStatuses.includes(status)) {
      logger.error(`Subscription update failed: invalid status ${status}`);
      return res.status(400).json({
        ok: false,
        error: `status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updates = [];
    const values = [];
    const now = new Date().toISOString();

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (end_date !== undefined) {
      updates.push("end_date = ?");
      values.push(end_date);
    }

    if (payment_reference !== undefined) {
      updates.push("payment_reference = ?");
      values.push(payment_reference);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "No fields provided for update"
      });
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.run(
      `UPDATE subscriptions SET ${updates.join(", ")} WHERE id = ?`,
      values,
      function (err) {
        if (err) {
          logger.error("Subscription update DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while updating subscription"
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            ok: false,
            error: "Subscription not found"
          });
        }

        logger.info(`Subscription updated: ${id}`);

        return res.json({
          ok: true,
          message: "Subscription updated successfully",
          subscription_id: id
        });
      }
    );
  } catch (error) {
    logger.error("Subscription update error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
