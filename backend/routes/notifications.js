import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// 🔢 Compter les notifications non lues (DOIT ÊTRE EN PREMIER)
router.get("/unread-count", (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).json({ error: 'uid required' });
  db.get(
    `SELECT COUNT(*) as count FROM notifications WHERE user_uid = ? AND is_read = 0`,
    [uid],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ count: row.count });
    }
  );
});

// 🔔 Récupérer toutes les notifications d'un utilisateur
router.get('/:uid', (req, res) => {
  const { uid } = req.params;
  db.all(
    `SELECT * FROM notifications WHERE user_uid = ? ORDER BY created_at DESC LIMIT 50`,
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ✅ Marquer une notification comme lue
router.put('/:id/read', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  db.run(
    `UPDATE notifications SET is_read = 1, updated_at = ? WHERE id = ?`,
    [now, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ✅ Marquer toutes comme lues
router.put('/:uid/read-all', (req, res) => {
  const { uid } = req.params;
  const now = new Date().toISOString();
  db.run(
    `UPDATE notifications SET is_read = 1, updated_at = ? WHERE user_uid = ?`,
    [now, uid],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// 🗑️ Supprimer une notification
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run(
    `DELETE FROM notifications WHERE id = ?`,
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ➕ Créer une notification
router.post('/', (req, res) => {
  const { user_uid, type, title, message, link, icon } = req.body;
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO notifications (user_uid, type, title, message, is_read, link, icon, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [user_uid, type || 'system', title, message, link || null, icon || '🔔', now, now],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

export default router;
