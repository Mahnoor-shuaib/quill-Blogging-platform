import express from 'express';
import { signup, login, getAccountInfo, rotateApiKey } from '../api/auth.js';
import {
  createPost, listPosts, getPost, publishPost, updatePost, deletePost,
  unpublishPost, schedulePost, manageSeo, getAnalytics
} from '../mcp/tools.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/dashboard/login');
  next();
}

router.get('/signup', (req, res) => res.render('signup', { error: null }));

router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await signup({ email, password });
    req.session.userId = result.userId;
    res.render('mcp-key', { mcpUrl: result.mcpUrl });
  } catch (err) {
    res.render('signup', { error: err.message });
  }
});

router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });
    req.session.userId = result.userId;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: err.message });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/dashboard/login'));
});

router.get('/', requireAuth, (req, res) => {
  const posts = listPosts({ user_id: req.session.userId });
  res.render('posts', { posts, userId: req.session.userId, msg: req.query.msg || null, err: req.query.err || null });
});

router.get('/posts/new', requireAuth, (req, res) => {
  res.render('edit-post', { post: null, err: null });
});

router.post('/posts/new', requireAuth, (req, res) => {
  try {
    const { title, content } = req.body;
    createPost({ user_id: req.session.userId, title, content });
    res.redirect('/dashboard?msg=' + encodeURIComponent('Post created successfully.'));
  } catch (err) {
    res.render('edit-post', { post: null, err: err.message });
  }
});

router.get('/posts/:id/edit', requireAuth, (req, res) => {
  try {
    const post = getPost({ user_id: req.session.userId, id: Number(req.params.id) });
    res.render('edit-post', { post, err: null });
  } catch (err) {
    res.redirect('/dashboard');
  }
});

router.post('/posts/:id/edit', requireAuth, (req, res) => {
  try {
    const { title, content } = req.body;
    updatePost({ user_id: req.session.userId, id: Number(req.params.id), title, content });
    res.redirect('/dashboard?msg=' + encodeURIComponent('Post updated successfully.'));
  } catch (err) {
    const post = getPost({ user_id: req.session.userId, id: Number(req.params.id) });
    res.render('edit-post', { post, err: err.message });
  }
});

router.post('/posts/:id/publish', requireAuth, (req, res) => {
  try {
    publishPost({ user_id: req.session.userId, id: Number(req.params.id) });
    res.redirect('/dashboard?msg=' + encodeURIComponent('Post published successfully.'));
  } catch (err) {
    res.redirect('/dashboard?err=' + encodeURIComponent(err.message));
  }
});

router.post('/posts/:id/delete', requireAuth, (req, res) => {
  try {
    deletePost({ user_id: req.session.userId, id: Number(req.params.id) });
    res.redirect('/dashboard?msg=' + encodeURIComponent('Post deleted.'));
  } catch (err) {
    res.redirect('/dashboard?err=' + encodeURIComponent(err.message));
  }
});

router.post('/posts/:id/unpublish', requireAuth, (req, res) => {
  try {
    unpublishPost({ user_id: req.session.userId, id: Number(req.params.id) });
    res.redirect('/dashboard?msg=' + encodeURIComponent('Post moved back to draft.'));
  } catch (err) {
    res.redirect('/dashboard?err=' + encodeURIComponent(err.message));
  }
});

router.post('/posts/:id/schedule', requireAuth, (req, res) => {
  try {
    let { publish_at } = req.body;
    const formatted = publish_at.replace('T', ' ') + ':00';
    schedulePost({ user_id: req.session.userId, id: Number(req.params.id), publish_at: formatted });
    res.redirect('/dashboard?msg=' + encodeURIComponent('Post scheduled successfully.'));
  } catch (err) {
    res.redirect('/dashboard?err=' + encodeURIComponent(err.message));
  }
});

router.get('/posts/:id/seo', requireAuth, (req, res) => {
  try {
    const post = getPost({ user_id: req.session.userId, id: Number(req.params.id) });
    res.render('seo', { post });
  } catch (err) {
    res.redirect('/dashboard');
  }
});

router.post('/posts/:id/seo', requireAuth, (req, res) => {
  try {
    const { meta_title, meta_description, slug } = req.body;
    manageSeo({ user_id: req.session.userId, id: Number(req.params.id), meta_title, meta_description, slug });
    res.redirect('/dashboard?msg=' + encodeURIComponent('SEO settings saved.'));
  } catch (err) {
    res.redirect('/dashboard?err=' + encodeURIComponent(err.message));
  }
});

router.get('/analytics', requireAuth, (req, res) => {
  const result = getAnalytics({ user_id: req.session.userId });
  res.render('analytics', { events: result.events, totalViews: result.total_views });
});

router.get('/account', requireAuth, (req, res) => {
  const info = getAccountInfo(req.session.userId);
  res.render('account', { email: info.email, activeKeyCount: info.activeKeyCount, newKey: null });
});

router.post('/account/rotate', requireAuth, async (req, res) => {
  const info = getAccountInfo(req.session.userId);
  const result = await rotateApiKey(req.session.userId);
  res.render('account', { email: info.email, activeKeyCount: 1, newKey: result.mcpUrl });
});

export default router;