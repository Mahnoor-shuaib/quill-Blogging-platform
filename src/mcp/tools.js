import db from '../db/schema.js';
import { validatePostInput, validateForPublish } from '../api/validate.js';

export function createPost({ user_id, title, content, tags }) {
  validatePostInput({ title, content });
  const stmt = db.prepare(`
    INSERT INTO posts (user_id, title, content_md, status)
    VALUES (?, ?, ?, 'draft')
  `);
  const result = stmt.run(user_id, title, content);
  return { id: result.lastInsertRowid, title, status: 'draft', message: 'Post draft created successfully.' };
}

export function listPosts({ user_id, status, limit }) {
  let query = `SELECT id, title, status, created_at, updated_at, scheduled_at FROM posts WHERE user_id = ?`;
  const params = [user_id];
  if (status) { query += ` AND status = ?`; params.push(status); }
  query += ` ORDER BY updated_at DESC`;
  if (limit) { query += ` LIMIT ?`; params.push(limit); }
  return db.prepare(query).all(...params);
}

export function getPost({ user_id, id }) {
  const post = db.prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`).get(id, user_id);
  if (!post) throw new Error('Post not found.');
  return post;
}

export function publishPost({ user_id, id }) {
  const existing = db.prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`).get(id, user_id);
  if (!existing) throw new Error('Post not found.');
  validateForPublish(existing);
  const stmt = db.prepare(`
    UPDATE posts SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `);
  stmt.run(id, user_id);
  return { id, status: 'published', message: 'Post published successfully.' };
}

export function updatePost({ user_id, id, title, content, tags }) {
  const existing = db.prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`).get(id, user_id);
  if (!existing) throw new Error('Post not found.');
  validatePostInput({ title, content });
  const newTitle = title !== undefined ? title : existing.title;
  const newContent = content !== undefined ? content : existing.content_md;
  db.prepare(`
    UPDATE posts SET title = ?, content_md = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(newTitle, newContent, id, user_id);
  return { id, title: newTitle, message: 'Post updated successfully.' };
}

export function deletePost({ user_id, id }) {
  const result = db.prepare(`DELETE FROM posts WHERE id = ? AND user_id = ?`).run(id, user_id);
  if (result.changes === 0) throw new Error('Post not found.');
  return { id, message: 'Post deleted successfully.' };
}

export function unpublishPost({ user_id, id }) {
  const result = db.prepare(`
    UPDATE posts SET status = 'draft', updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(id, user_id);
  if (result.changes === 0) throw new Error('Post not found.');
  return { id, status: 'draft', message: 'Post reverted to draft.' };
}

export function schedulePost({ user_id, id, publish_at }) {
  const existing = db.prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`).get(id, user_id);
  if (!existing) throw new Error('Post not found.');
  validateForPublish(existing);
  db.prepare(`
    UPDATE posts SET status = 'scheduled', scheduled_at = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(publish_at, id, user_id);
  return { id, status: 'scheduled', scheduled_at: publish_at, message: 'Post scheduled successfully.' };
}

export function manageSeo({ user_id, id, meta_title, meta_description, slug }) {
  const existing = db.prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`).get(id, user_id);
  if (!existing) throw new Error('Post not found.');
  const newMetaTitle = meta_title !== undefined ? meta_title : existing.meta_title;
  const newMetaDesc = meta_description !== undefined ? meta_description : existing.meta_description;
  const newSlug = slug !== undefined ? slug : existing.slug;
  db.prepare(`
    UPDATE posts SET meta_title = ?, meta_description = ?, slug = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(newMetaTitle, newMetaDesc, newSlug, id, user_id);
  return { id, message: 'SEO metadata updated successfully.' };
}

export function getAnalytics({ user_id, post_id, range }) {
  let query = `
    SELECT ae.event_type, ae.referrer, ae.occurred_at, ae.post_id
    FROM analytics_events ae JOIN posts p ON p.id = ae.post_id
    WHERE p.user_id = ?
  `;
  const params = [user_id];
  if (post_id) { query += ` AND ae.post_id = ?`; params.push(post_id); }
  query += ` ORDER BY ae.occurred_at DESC`;
  const events = db.prepare(query).all(...params);
  const totalViews = events.filter(e => e.event_type === 'view').length;
  return { range: range || 'all-time', total_views: totalViews, events };
}

export function listPublishedPosts({ user_id }) {
  return db.prepare(`
    SELECT id, title, slug, meta_description, published_at FROM posts
    WHERE user_id = ? AND status = 'published' ORDER BY published_at DESC
  `).all(user_id);
}

export function getPublishedPostByIdOrSlug({ user_id, idOrSlug }) {
  const numericId = Number(idOrSlug);
  return db.prepare(`
    SELECT * FROM posts WHERE user_id = ? AND status = 'published' AND (slug = ? OR id = ?)
  `).get(user_id, idOrSlug, isNaN(numericId) ? -1 : numericId);
}

export function recordView({ post_id, referrer }) {
  db.prepare(`INSERT INTO analytics_events (post_id, event_type, referrer) VALUES (?, 'view', ?)`).run(post_id, referrer || null);
}

export function publishDuePosts() {
  const result = db.prepare(`
    UPDATE posts SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
    WHERE status = 'scheduled' AND scheduled_at <= datetime('now', 'localtime')
  `).run();
  if (result.changes > 0) {
    console.log(`Auto-published ${result.changes} scheduled post(s).`);
  }
  return result.changes;
}