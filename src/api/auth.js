import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/schema.js';

const SALT_ROUNDS = 10;

export async function signup({ email, password }) {
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash) VALUES (?, ?)
  `);
  const userResult = insertUser.run(email, passwordHash);
  const userId = userResult.lastInsertRowid;

  const plainApiKey = uuidv4();
  const keyHash = await bcrypt.hash(plainApiKey, SALT_ROUNDS);

  const insertKey = db.prepare(`
    INSERT INTO api_keys (user_id, key_hash) VALUES (?, ?)
  `);
  insertKey.run(userId, keyHash);

  return {
    userId,
    email,
    apiKey: plainApiKey,
    mcpUrl: `http://localhost:${process.env.PORT || 3000}/mcp/${plainApiKey}`
  };
}

export async function login({ email, password }) {
  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  return { userId: user.id, email: user.email };
}

export async function getUserIdFromApiKey(plainApiKey) {
  const allKeys = db.prepare(`
    SELECT * FROM api_keys WHERE revoked_at IS NULL
  `).all();

  for (const key of allKeys) {
    const match = await bcrypt.compare(plainApiKey, key.key_hash);
    if (match) {
      return key.user_id;
    }
  }

  return null;
}

// User ki current email aur active keys ki count nikalta hai (account page ke liye)
export function getAccountInfo(userId) {
  const user = db.prepare(`SELECT email, created_at FROM users WHERE id = ?`).get(userId);
  const activeKeys = db.prepare(`
    SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND revoked_at IS NULL
  `).get(userId);
  return { email: user.email, createdAt: user.created_at, activeKeyCount: activeKeys.count };
}

// Purani key(s) revoke kar ke ek naya API key issue karta hai
export async function rotateApiKey(userId) {
  db.prepare(`
    UPDATE api_keys SET revoked_at = datetime('now')
    WHERE user_id = ? AND revoked_at IS NULL
  `).run(userId);

  const plainApiKey = uuidv4();
  const keyHash = await bcrypt.hash(plainApiKey, SALT_ROUNDS);

  db.prepare(`
    INSERT INTO api_keys (user_id, key_hash) VALUES (?, ?)
  `).run(userId, keyHash);

  return {
    apiKey: plainApiKey,
    mcpUrl: `http://localhost:${process.env.PORT || 3000}/mcp/${plainApiKey}`
  };
}

// Sirf revoke karta hai (naya key nahi banata) — agar user chahe access band karna
export function revokeAllKeys(userId) {
  db.prepare(`
    UPDATE api_keys SET revoked_at = datetime('now')
    WHERE user_id = ? AND revoked_at IS NULL
  `).run(userId);
}