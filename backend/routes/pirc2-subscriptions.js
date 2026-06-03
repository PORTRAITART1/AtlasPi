import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";

const router = express.Router();

/**
 * POST /api/pirc2/subscriptions/create
 * Create a local PiRC2 subscription registry entry
 */
router.post("/create", (req, res) => {
  try {
    const {
      contract_sub_id,
      service_id,
      subscriber_uid,
      subscriber_username,
      subscriber_wallet,
      merchant_listing_id,
      status,
      auto_renew,
      pay_upfront,
      price_amount,
      price_currency,
      trial_end_ts,
      service_end_ts,
      next_charge_ts,
      last_contract_sync_at
    } = req.body;

    if (!service_id || !price_amount) {
      return res.status(400).json({
        ok: false,
        error: "service_id and price_amount are required"
      });
    }

    const now = new Date().toISOString();

    db.get(
      `SELECT id FROM subscription_services WHERE id = ?`,
      [service_id],
      (serviceErr, serviceRow) => {
        if (serviceErr) {
          logger.error("PiRC2 subscription service lookup DB error: " + serviceErr.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while validating service"
          });
        }

        if (!serviceRow) {
          return res.status(404).json({
            ok: false,
            error: "PiRC2 service not found"
          });
        }

        db.run(
          `INSERT INTO subscriptions_registry
           (contract_sub_id, service_id, subscriber_uid, subscriber_username, subscriber_wallet,
            merchant_listing_id, status, auto_renew, pay_upfront, price_amount, price_currency,
            trial_end_ts, service_end_ts, next_charge_ts, last_contract_sync_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            contract_sub_id || null,
            service_id,
            subscriber_uid || null,
            subscriber_username || null,
            subscriber_wallet || null,
            merchant_listing_id || null,
            status || "pending",
            auto_renew ? 1 : 0,
            pay_upfront ? 1 : 0,
            price_amount,
            price_currency || "PI",
            trial_end_ts || null,
            service_end_ts || null,
            next_charge_ts || null,
            last_contract_sync_at || null,
            now,
            now
          ],
          function (err) {
            if (err) {
              logger.error("PiRC2 subscription create DB error: " + err.message);
              return res.status(500).json({
                ok: false,
                error: "Database error while creating PiRC2 subscription"
              });
            }

            return res.json({
              ok: true,
              message: "PiRC2 subscription created successfully",
              subscription: {
                id: this.lastID,
                contract_sub_id: contract_sub_id || null,
                service_id,
                subscriber_uid: subscriber_uid || null,
                subscriber_username: subscriber_username || null,
                subscriber_wallet: subscriber_wallet || null,
                merchant_listing_id: merchant_listing_id || null,
                status: status || "pending",
                auto_renew: auto_renew ? 1 : 0,
                pay_upfront: pay_upfront ? 1 : 0,
                price_amount,
                price_currency: price_currency || "PI",
                created_at: now
              }
            });
          }
        );
      }
    );
  } catch (error) {
    logger.error("PiRC2 subscription create route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pirc2/subscriptions/list
 * List local PiRC2 subscriptions
 */
router.get("/list", (req, res) => {
  const { service_id, subscriber_uid, status } = req.query;

  let query = `
    SELECT
      sr.id,
      sr.contract_sub_id,
      sr.service_id,
      sr.subscriber_uid,
      sr.subscriber_username,
      sr.subscriber_wallet,
      sr.merchant_listing_id,
      sr.status,
      sr.auto_renew,
      sr.pay_upfront,
      sr.price_amount,
      sr.price_currency,
      sr.trial_end_ts,
      sr.service_end_ts,
      sr.next_charge_ts,
      sr.last_contract_sync_at,
      sr.created_at,
      sr.updated_at,
      ss.name AS service_name,
      ss.service_code
    FROM subscriptions_registry sr
    LEFT JOIN subscription_services ss ON ss.id = sr.service_id
    WHERE 1=1
  `;

  const params = [];

  if (service_id) {
    query += ` AND sr.service_id = ?`;
    params.push(service_id);
  }

  if (subscriber_uid) {
    query += ` AND sr.subscriber_uid = ?`;
    params.push(subscriber_uid);
  }

  if (status) {
    query += ` AND sr.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY sr.id DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      logger.error("PiRC2 subscriptions list DB error: " + err.message);
      return res.status(500).json({
        ok: false,
        error: "Database error while loading PiRC2 subscriptions"
      });
    }

    return res.json({
      ok: true,
      count: rows ? rows.length : 0,
      subscriptions: rows || []
    });
  });
});

/**
 * GET /api/pirc2/subscriptions/:id
 * Get one local PiRC2 subscription by id
 */
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.get(
    `
    SELECT
      sr.id,
      sr.contract_sub_id,
      sr.service_id,
      sr.subscriber_uid,
      sr.subscriber_username,
      sr.subscriber_wallet,
      sr.merchant_listing_id,
      sr.status,
      sr.auto_renew,
      sr.pay_upfront,
      sr.price_amount,
      sr.price_currency,
      sr.trial_end_ts,
      sr.service_end_ts,
      sr.next_charge_ts,
      sr.last_contract_sync_at,
      sr.created_at,
      sr.updated_at,
      ss.name AS service_name,
      ss.service_code
    FROM subscriptions_registry sr
    LEFT JOIN subscription_services ss ON ss.id = sr.service_id
    WHERE sr.id = ?
    `,
    [id],
    (err, row) => {
      if (err) {
        logger.error("PiRC2 subscription detail DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading PiRC2 subscription"
        });
      }

      if (!row) {
        return res.status(404).json({
          ok: false,
          error: "PiRC2 subscription not found"
        });
      }

      return res.json({
        ok: true,
        subscription: row
      });
    }
  );
});

/**
 * POST /api/pirc2/subscriptions/cancel/:id
 * Cancel recurring renewal for a subscription
 */
 router.post("/cancel/:id", (req, res) => {
    const { id } = req.params;
    const { subscriber_uid } = req.body;
  
    if (!id || !subscriber_uid) {
      return res.status(400).json({
        ok: false,
        error: "Subscription id and subscriber_uid are required"
      });
    }
  
    db.get(
      `SELECT id, subscriber_uid, auto_renew, status
       FROM subscriptions_registry
       WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) {
          logger.error("PiRC2 cancel lookup DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while loading PiRC2 subscription"
          });
        }
  
        if (!row) {
          return res.status(404).json({
            ok: false,
            error: "PiRC2 subscription not found"
          });
        }
  
        if (row.subscriber_uid !== subscriber_uid) {
          return res.status(403).json({
            ok: false,
            error: "Unauthorized. Subscription does not belong to this subscriber."
          });
        }
  
        if (!row.auto_renew) {
          return res.status(400).json({
            ok: false,
            error: "Subscription is already cancelled"
          });
        }
  
        const now = new Date().toISOString();
  
        db.run(
          `UPDATE subscriptions_registry
           SET auto_renew = 0, updated_at = ?
           WHERE id = ?`,
          [now, id],
          function (updateErr) {
            if (updateErr) {
              logger.error("PiRC2 cancel update DB error: " + updateErr.message);
              return res.status(500).json({
                ok: false,
                error: "Database error while cancelling PiRC2 subscription"
              });
            }
  
            db.run(
              `INSERT INTO subscription_events
               (subscription_id, contract_sub_id, event_type, event_source, payload_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                id,
                null,
                "cancel",
                "backend",
                JSON.stringify({ subscriber_uid }),
                now
              ],
              () => {}
            );
  
            return res.json({
              ok: true,
              message: "PiRC2 subscription cancelled successfully",
              id: Number(id),
              auto_renew: 0
            });
          }
        );
      }
    );
  });
  
  /**
   * POST /api/pirc2/subscriptions/toggle-auto-renew/:id
   * Toggle auto_renew on/off for a subscription
   */
  router.post("/toggle-auto-renew/:id", (req, res) => {
    const { id } = req.params;
    const { subscriber_uid } = req.body;
  
    if (!id || !subscriber_uid) {
      return res.status(400).json({
        ok: false,
        error: "Subscription id and subscriber_uid are required"
      });
    }
  
    db.get(
      `SELECT id, subscriber_uid, auto_renew, status
       FROM subscriptions_registry
       WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) {
          logger.error("PiRC2 toggle lookup DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while loading PiRC2 subscription"
          });
        }
  
        if (!row) {
          return res.status(404).json({
            ok: false,
            error: "PiRC2 subscription not found"
          });
        }
  
        if (row.subscriber_uid !== subscriber_uid) {
          return res.status(403).json({
            ok: false,
            error: "Unauthorized. Subscription does not belong to this subscriber."
          });
        }
  
        if (row.status === "expired") {
          return res.status(400).json({
            ok: false,
            error: "Expired subscription cannot toggle auto-renew"
          });
        }
  
        const nextAutoRenew = row.auto_renew ? 0 : 1;
        const now = new Date().toISOString();
  
        db.run(
          `UPDATE subscriptions_registry
           SET auto_renew = ?, updated_at = ?
           WHERE id = ?`,
          [nextAutoRenew, now, id],
          function (updateErr) {
            if (updateErr) {
              logger.error("PiRC2 toggle update DB error: " + updateErr.message);
              return res.status(500).json({
                ok: false,
                error: "Database error while toggling auto-renew"
              });
            }
  
            db.run(
              `INSERT INTO subscription_events
               (subscription_id, contract_sub_id, event_type, event_source, payload_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                id,
                null,
                "toggle_auto_renew",
                "backend",
                JSON.stringify({ subscriber_uid, auto_renew: nextAutoRenew }),
                now
              ],
              () => {}
            );
  
            return res.json({
              ok: true,
              message: "PiRC2 auto-renew updated successfully",
              id: Number(id),
              auto_renew: nextAutoRenew
            });
          }
        );
      }
    );
  });
  
  /**
   * POST /api/pirc2/subscriptions/extend/:id
   * Extend / refresh a subscription locally
   */
  router.post("/extend/:id", (req, res) => {
    const { id } = req.params;
    const { subscriber_uid } = req.body;
  
    if (!id || !subscriber_uid) {
      return res.status(400).json({
        ok: false,
        error: "Subscription id and subscriber_uid are required"
      });
    }
  
    db.get(
      `SELECT id, subscriber_uid, status
       FROM subscriptions_registry
       WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) {
          logger.error("PiRC2 extend lookup DB error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while loading PiRC2 subscription"
          });
        }
  
        if (!row) {
          return res.status(404).json({
            ok: false,
            error: "PiRC2 subscription not found"
          });
        }
  
        if (row.subscriber_uid !== subscriber_uid) {
          return res.status(403).json({
            ok: false,
            error: "Unauthorized. Subscription does not belong to this subscriber."
          });
        }
  
        if (row.status === "expired") {
          return res.status(400).json({
            ok: false,
            error: "Expired subscription cannot be extended"
          });
        }
  
        const now = new Date().toISOString();
  
        db.run(
          `UPDATE subscriptions_registry
           SET auto_renew = 1,
               status = 'active',
               last_contract_sync_at = ?,
               updated_at = ?
           WHERE id = ?`,
          [now, now, id],
          function (updateErr) {
            if (updateErr) {
              logger.error("PiRC2 extend update DB error: " + updateErr.message);
              return res.status(500).json({
                ok: false,
                error: "Database error while extending PiRC2 subscription"
              });
            }
  
            db.run(
              `INSERT INTO subscription_events
               (subscription_id, contract_sub_id, event_type, event_source, payload_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                id,
                null,
                "extend",
                "backend",
                JSON.stringify({ subscriber_uid }),
                now
              ],
              () => {}
            );
  
            return res.json({
              ok: true,
              message: "PiRC2 subscription extended successfully",
              id: Number(id),
              auto_renew: 1,
              status: "active"
            });
          }
        );
      }
    );
  });
export default router;