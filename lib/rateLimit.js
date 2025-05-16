// Simple in-memory rate limiter for demonstration (not for production)
// For production, use Redis or a distributed store

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max requests per window per IP

const ipStore = new Map();

export function rateLimit(ip) {
  const now = Date.now();
  let entry = ipStore.get(ip);
  if (!entry) {
    entry = { count: 1, start: now };
    ipStore.set(ip, entry);
    return { allowed: true };
  }
  if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
    // Reset window
    entry.count = 1;
    entry.start = now;
    ipStore.set(ip, entry);
    return { allowed: true };
  }
  if (entry.count < RATE_LIMIT_MAX_REQUESTS) {
    entry.count++;
    ipStore.set(ip, entry);
    return { allowed: true };
  }
  return { allowed: false, retryAfter: RATE_LIMIT_WINDOW_MS - (now - entry.start) };
}
