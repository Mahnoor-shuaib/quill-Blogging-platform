// Simple in-memory rate limiter — har user ke liye per-minute limit
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // is se zyada requests per minute allow nahi

const usage = new Map();

export function checkRateLimit(userId) {
  const now = Date.now();
  const record = usage.get(userId);

  if (!record || now - record.windowStart > WINDOW_MS) {
    usage.set(userId, { windowStart: now, count: 1 });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  return true;
}