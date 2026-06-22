import express from "express";
import db from "../config/db.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import { requireAdminSecret } from "../middlewares/adminAuth.js";

const router = express.Router();

router.post("/create", (req, res) => {
  try {
    const { name, email, support_type, message } = req.body;

    if (!name || !email || !support_type || !message) {
      return res.status(400).json({
        ok: false,
        error: "name, email, support_type and message are required"
      });
    }

    const requestUuid = uuidv4();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO support_requests
       (request_uuid, name, email, support_type, message, status, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestUuid,
        name,
        email,
        support_type,
        message,
        "open",
        "frontend",
        now,
        now
      ],
      function (err) {
        if (err) {
          logger.error("Support request DB insert error: " + err.message);
          return res.status(500).json({
            ok: false,
            error: "Database error while creating support request"
          });
        }

        logger.info(`Support request created: ${requestUuid}`);

        return res.json({
          ok: true,
          message: "Support request created successfully",
          request_uuid: requestUuid,
          status: "open"
        });
      }
    );
  } catch (error) {
    logger.error("Support create route error: " + error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.get("/list", requireAdminSecret, (req, res) => {
  db.all(
    `SELECT id, request_uuid, name, email, support_type, message, status, source, created_at, updated_at
     FROM support_requests
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        logger.error("Support requests list DB error: " + err.message);
        return res.status(500).json({
          ok: false,
          error: "Database error while loading support requests"
        });
      }

      return res.json({
        ok: true,
        count: rows.length,
        requests: rows
      });
    }
  );
});

export default router;