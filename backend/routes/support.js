const express = require("express");
const db = require("../config/db.js");
const logger = require("../utils/logger.js");
const { v4: uuidv4 } = require("uuid");
const { validateBody } = require("../middlewares/validate.js");
const { createSupportRequestSchema } = require("../validators/support.validators.js");

const router = express.Router();

router.post("/create", validateBody(createSupportRequestSchema), async (req, res) => {
  try {
    const { name, email, support_type, message } = req.body;

    if (!name || !email || !support_type || !message) {
      return res.status(400).json({
        ok: false,
        error: "name, email, support_type and message are required"
      });
    }

    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO support_requests (id, name, email, support_type, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `);
    stmt.run(id, name, email, support_type, message);

    logger.info(`Support request created: ${id} from ${email}`);

    res.status(201).json({
      ok: true,
      message: "Support request created successfully",
      id: id
    });

  } catch (error) {
    logger.error("Error in support route:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/list", async (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM support_requests ORDER BY created_at DESC").all();
    res.json({ ok: true, data: rows });
  } catch (error) {
    logger.error("Error listing support requests:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid status. Must be: pending, in_progress, resolved, closed"
      });
    }

    const stmt = db.prepare("UPDATE support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?");
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Support request not found" });
    }

    res.json({ ok: true, message: "Status updated successfully" });

  } catch (error) {
    logger.error("Error updating support request status:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

module.exports = router;
