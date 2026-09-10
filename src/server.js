import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { buildMcpServer } from './mcp/server.js';
import { signup, login, getUserIdFromApiKey } from './api/auth.js';
import { checkRateLimit } from './api/rateLimiter.js';
import { publishDuePosts } from './mcp/tools.js';
import dashboardRoutes from './dashboard/routes.js';
import publicSiteRoutes from './public-site/routes.js';
import './db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'dashboard', 'views'),
  path.join(__dirname, 'public-site', 'views')
]);

app.use('/dashboard-assets', express.static(path.join(__dirname, 'dashboard', 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false
}));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/dashboard', dashboardRoutes);
app.use('/blog', publicSiteRoutes);

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await signup({ email, password });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post('/mcp/:apiKey', async (req, res) => {
  const userId = await getUserIdFromApiKey(req.params.apiKey);

  if (!userId) {
    return res.status(401).json({ error: 'Invalid or revoked API key.' });
  }

  if (!checkRateLimit(userId)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' });
  }

  const server = buildMcpServer(userId);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, () => {
  console.log(`Quill server running at http://localhost:${PORT}`);
  // Har 30 second mein check karo koi scheduled post publish karna hai ya nahi
  setInterval(publishDuePosts, 30 * 1000);
});