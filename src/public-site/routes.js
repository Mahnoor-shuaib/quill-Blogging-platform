import express from 'express';
import { marked } from 'marked';
import { listPublishedPosts, getPublishedPostByIdOrSlug, recordView } from '../mcp/tools.js';

const router = express.Router();

// --- Public blog list for a user ---
router.get('/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const posts = listPublishedPosts({ user_id: userId });
  res.render('blog-list', { posts, userId, blogName: `User ${userId}'s Blog` });
});

// --- Public single post ---
router.get('/:userId/:idOrSlug', (req, res) => {
  const userId = Number(req.params.userId);
  const post = getPublishedPostByIdOrSlug({ user_id: userId, idOrSlug: req.params.idOrSlug });

  if (!post) {
    return res.status(404).send('Post not found.');
  }

  // Analytics event record karein — har visit ek "view" hai
  recordView({ post_id: post.id, referrer: req.get('Referrer') || null });

  const contentHtml = marked.parse(post.content_md || '');
  res.render('blog-post', { post, contentHtml, userId });
});

export default router;