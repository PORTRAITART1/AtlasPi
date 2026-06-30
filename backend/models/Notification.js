import db from '../config/db.js';

// Create notifications table if not exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_uid TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT,
      icon TEXT DEFAULT '🔔',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating notifications table:', err.message);
    } else {
      console.log('✅ Table ready: notifications');
    }
  });
});

export default db;