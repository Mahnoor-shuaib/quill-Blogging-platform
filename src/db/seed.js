import db from './schema.js';

const stmt = db.prepare(`
  INSERT INTO users (email, password_hash)
  VALUES (?, ?)
`);

const result = stmt.run('test@quill.dev', 'temporary-placeholder-hash');

console.log(`Test user created with id: ${result.lastInsertRowid}`);