/**
 * realUsersTracker.js
 * Compte les vrais utilisateurs Pi (via authentification)
 * et notifie l'admin quand on atteint 100
 */

const db = require("../config/db.js");
const logger = require("./logger.js");

const TARGET_COUNT = 100;

/**
 * Initialise la table de tracking
 */
function initTracker() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS real_users_tracking (
        uid TEXT PRIMARY KEY,
        username TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);

    logger.info("✅ Real users tracker tables ready");
  } catch (err) {
    logger.error("❌ Tracker init error:", err.message);
  }
}

/**
 * Enregistre un vrai utilisateur (dédupliqué par uid)
 * et notifie l'admin si on atteint TARGET_COUNT
 */
function trackRealUser(uid, username) {
  try {
    const now = new Date().toISOString();

    // Vérifier si l'utilisateur existe déjà
    const existing = db.prepare("SELECT uid FROM real_users_tracking WHERE uid = ?").get(uid);

    if (existing) {
      // Mettre à jour last_seen_at
      db.prepare("UPDATE real_users_tracking SET last_seen_at = ? WHERE uid = ?").run(now, uid);
      return { isNew: false, count: getCount() };
    }

    // Nouvel utilisateur
    db.prepare(`
      INSERT INTO real_users_tracking (uid, username, first_seen_at, last_seen_at)
      VALUES (?, ?, ?, ?)
    `).run(uid, username || "Unknown", now, now);

    const count = getCount();
    logger.info(`[Tracker] Nouveau pionnier #${count}: ${username || uid}`);

    // ✅ Si on atteint exactement 100, créer une notification
    if (count === TARGET_COUNT) {
      createNotification(
        "target_reached",
        "🎉 100 Pionniers Réels Atteints !",
        `Félicitations ! Tu as maintenant ${count} vrais pionniers qui ont utilisé AtlasPi. Tu peux maintenant supprimer les marchands de démonstration et passer en production réelle.`
      );
      logger.info("🎉 TARGET REACHED: 100 real users!");
    }

    return { isNew: true, count };
  } catch (err) {
    logger.error("[Tracker] Error:", err.message);
    return { isNew: false, count: getCount() };
  }
}

/**
 * Compte les vrais utilisateurs
 */
function getCount() {
  try {
    const row = db.prepare("SELECT COUNT(*) as c FROM real_users_tracking").get();
    return row ? row.c : 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Crée une notification admin
 */
function createNotification(type, title, message) {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO admin_notifications (type, title, message, created_at)
      VALUES (?, ?, ?, ?)
    `).run(type, title, message, now);
  } catch (err) {
    logger.error("[Tracker] Notification error:", err.message);
  }
}

/**
 * Récupère les notifications non lues
 */
function getUnreadNotifications() {
  try {
    return db.prepare("SELECT * FROM admin_notifications WHERE is_read = 0 ORDER BY created_at DESC").all();
  } catch (err) {
    return [];
  }
}

/**
 * Marque une notification comme lue
 */
function markAsRead(id) {
  try {
    db.prepare("UPDATE admin_notifications SET is_read = 1 WHERE id = ?").run(id);
  } catch (err) {
    logger.error("[Tracker] Mark read error:", err.message);
  }
}

/**
 * Supprime tous les marchands de démonstration
 */
function deleteDemoMerchants() {
  try {
    const result = db.prepare("DELETE FROM merchant_listings WHERE owner_user_id LIKE 'demo_%'").run();
    logger.info(`🗑️  ${result.changes} marchands de démonstration supprimés`);
    return result.changes;
  } catch (err) {
    logger.error("[Tracker] Delete demo error:", err.message);
    return 0;
  }
}

module.exports = {
  initTracker,
  trackRealUser,
  getCount,
  getUnreadNotifications,
  markAsRead,
  deleteDemoMerchants,
  TARGET_COUNT
};
