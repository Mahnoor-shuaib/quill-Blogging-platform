import db from './schema.js';

const logs = db.prepare(`SELECT * FROM audit_log ORDER BY occurred_at DESC LIMIT 10`).all();
console.log(logs);