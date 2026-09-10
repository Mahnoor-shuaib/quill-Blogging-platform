import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import db from '../db/schema.js';
import {
  createPost, listPosts, getPost, publishPost, updatePost, deletePost,
  unpublishPost, schedulePost, manageSeo, getAnalytics
} from './tools.js';

// Har tool call ko audit_log table mein record karta hai
function logToolCall(userId, toolName, success, errorMessage = null) {
  db.prepare(`
    INSERT INTO audit_log (user_id, tool_name, success, error_message)
    VALUES (?, ?, ?, ?)
  `).run(userId, toolName, success ? 1 : 0, errorMessage);
}

// Har tool handler ko is se wrap karte hain — audit logging automatic ho jati hai
function withLogging(userId, toolName, handler) {
  return async (input) => {
    try {
      const result = await handler(input);
      logToolCall(userId, toolName, true);
      return result;
    } catch (err) {
      logToolCall(userId, toolName, false, err.message);
      throw err;
    }
  };
}

export function buildMcpServer(userId) {
  const server = new McpServer({
    name: 'quill-mcp',
    version: '1.0.0'
  });

  server.registerTool(
    'create_post',
    {
      title: 'Create Post',
      description: 'Create a new draft blog post',
      inputSchema: {
        title: z.string().describe('The title of the blog post'),
        content: z.string().describe('The content of the post in Markdown'),
        tags: z.array(z.string()).optional().describe('Optional tags for the post')
      }
    },
    withLogging(userId, 'create_post', async ({ title, content, tags }) => {
      const post = createPost({ user_id: userId, title, content, tags });
      return { content: [{ type: 'text', text: `Draft created: "${post.title}" (id: ${post.id})` }] };
    })
  );

  server.registerTool(
    'list_posts',
    {
      title: 'List Posts',
      description: 'List blog posts, optionally filtered by status',
      inputSchema: {
        status: z.enum(['draft', 'published', 'scheduled']).optional().describe('Filter posts by status'),
        limit: z.number().optional().describe('Maximum number of posts to return')
      }
    },
    withLogging(userId, 'list_posts', async ({ status, limit }) => {
      const posts = listPosts({ user_id: userId, status, limit });
      return { content: [{ type: 'text', text: JSON.stringify(posts, null, 2) }] };
    })
  );

  server.registerTool(
    'get_post',
    {
      title: 'Get Post',
      description: 'Fetch full content of one post by id',
      inputSchema: {
        id: z.number().describe('The id of the post to fetch')
      }
    },
    withLogging(userId, 'get_post', async ({ id }) => {
      const post = getPost({ user_id: userId, id });
      return { content: [{ type: 'text', text: JSON.stringify(post, null, 2) }] };
    })
  );

  server.registerTool(
    'publish_post',
    {
      title: 'Publish Post',
      description: 'Publish a draft post immediately',
      inputSchema: {
        id: z.number().describe('The id of the post to publish')
      }
    },
    withLogging(userId, 'publish_post', async ({ id }) => {
      const result = publishPost({ user_id: userId, id });
      return { content: [{ type: 'text', text: result.message }] };
    })
  );

  server.registerTool(
    'update_post',
    {
      title: 'Update Post',
      description: 'Edit an existing post (title and/or content)',
      inputSchema: {
        id: z.number().describe('The id of the post to update'),
        title: z.string().optional().describe('New title'),
        content: z.string().optional().describe('New content in Markdown'),
        tags: z.array(z.string()).optional().describe('New tags')
      }
    },
    withLogging(userId, 'update_post', async ({ id, title, content, tags }) => {
      const result = updatePost({ user_id: userId, id, title, content, tags });
      return { content: [{ type: 'text', text: result.message }] };
    })
  );

  server.registerTool(
    'delete_post',
    {
      title: 'Delete Post',
      description: 'Delete a post',
      inputSchema: {
        id: z.number().describe('The id of the post to delete')
      }
    },
    withLogging(userId, 'delete_post', async ({ id }) => {
      const result = deletePost({ user_id: userId, id });
      return { content: [{ type: 'text', text: result.message }] };
    })
  );

  server.registerTool(
    'unpublish_post',
    {
      title: 'Unpublish Post',
      description: 'Revert a published post back to draft',
      inputSchema: {
        id: z.number().describe('The id of the post to unpublish')
      }
    },
    withLogging(userId, 'unpublish_post', async ({ id }) => {
      const result = unpublishPost({ user_id: userId, id });
      return { content: [{ type: 'text', text: result.message }] };
    })
  );

  server.registerTool(
    'schedule_post',
    {
      title: 'Schedule Post',
      description: 'Schedule a post to be published at a future date/time',
      inputSchema: {
        id: z.number().describe('The id of the post to schedule'),
        publish_at: z.string().describe('The future date/time to publish (ISO format, e.g. 2026-09-15T10:00:00)')
      }
    },
    withLogging(userId, 'schedule_post', async ({ id, publish_at }) => {
      const result = schedulePost({ user_id: userId, id, publish_at });
      return { content: [{ type: 'text', text: result.message }] };
    })
  );

  server.registerTool(
    'manage_seo',
    {
      title: 'Manage SEO',
      description: 'Set meta title, description, and slug for a post',
      inputSchema: {
        id: z.number().describe('The id of the post'),
        meta_title: z.string().optional().describe('SEO meta title'),
        meta_description: z.string().optional().describe('SEO meta description'),
        slug: z.string().optional().describe('URL slug for the post')
      }
    },
    withLogging(userId, 'manage_seo', async ({ id, meta_title, meta_description, slug }) => {
      const result = manageSeo({ user_id: userId, id, meta_title, meta_description, slug });
      return { content: [{ type: 'text', text: result.message }] };
    })
  );

  server.registerTool(
    'get_analytics',
    {
      title: 'Get Analytics',
      description: 'Get views, referrers, and top posts for a date range',
      inputSchema: {
        post_id: z.number().optional().describe('Filter analytics for a specific post'),
        range: z.string().optional().describe('Date range description (e.g. "last 7 days")')
      }
    },
    withLogging(userId, 'get_analytics', async ({ post_id, range }) => {
      const result = getAnalytics({ user_id: userId, post_id, range });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    })
  );

  return server;
}