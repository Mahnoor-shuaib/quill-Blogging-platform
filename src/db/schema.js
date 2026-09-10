import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || './quill.db';

const db = new Database(path.resolve(__dirname, '../..', dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    revoked_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    slug TEXT,
    content_md TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    meta_title TEXT,
    meta_description TEXT,
    published_at TEXT,
    scheduled_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    referrer TEXT,
    occurred_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (post_id) REFERENCES posts(id)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tool_name TEXT NOT NULL,
    success INTEGER NOT NULL,
    error_message TEXT,
    occurred_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log('Database schema ready ✅');

export default db;