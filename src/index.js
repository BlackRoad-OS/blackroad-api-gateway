/**
 * BlackRoad API Gateway
 * Unified gateway for all BlackRoad enterprise products
 *
 * Features:
 * - Authentication & Authorization (JWT, API keys)
 * - Rate Limiting (per user/product/tier)
 * - Request Routing (to product backends)
 * - Usage Tracking (for billing)
 * - Analytics & Logging
 *
 * @license PROPRIETARY - BlackRoad OS, Inc.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jwt } from 'hono/jwt';
import { z } from 'zod';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://blackroad.io', 'https://*.blackroad.io', 'https://*.pages.dev'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'BlackRoad API Gateway',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();

  // TODO: Validate credentials against D1
  // TODO: Generate JWT token
  // TODO: Track login event

  return c.json({
    token: 'jwt_token_here',
    user: { email, id: 'user_id' },
    products: ['vllm', 'keycloak', 'minio'],
  });
});

app.post('/auth/register', async (c) => {
  const { email, password, plan } = await c.req.json();

  // TODO: Create user in D1
  // TODO: Create Stripe customer
  // TODO: Send welcome email

  return c.json({
    success: true,
    user: { email, id: 'new_user_id' },
  });
});

// Protected routes (require JWT)
app.use('/api/*', jwt({ secret: c => c.env.JWT_SECRET }));

// Rate Limiting Middleware
async function checkRateLimit(c, next) {
  const userId = c.get('jwtPayload').sub;
  const key = `rate_limit:${userId}:${Date.now() / 60000 | 0}`; // Per minute

  const count = await c.env.RATE_LIMIT.get(key);

  // TODO: Get user's tier from DB
  const limit = 1000; // Requests per minute

  if (count && parseInt(count) >= limit) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  await c.env.RATE_LIMIT.put(key, (parseInt(count || 0) + 1).toString(), { expirationTtl: 60 });

  await next();
}

app.use('/api/*', checkRateLimit);

// Product Routing

// BlackRoad vLLM
app.all('/api/vllm/*', async (c) => {
  const path = c.req.path.replace('/api/vllm', '');

  // Track usage for billing
  await trackUsage(c, 'vllm');

  // Forward to vLLM backend
  const response = await fetch(`https://vllm-backend.blackroad.internal${path}`, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });

  return new Response(response.body, response);
});

// BlackRoad Keycloak
app.all('/api/identity/*', async (c) => {
  const path = c.req.path.replace('/api/identity', '');

  await trackUsage(c, 'keycloak');

  const response = await fetch(`https://keycloak-backend.blackroad.internal${path}`, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });

  return new Response(response.body, response);
});

// BlackRoad MinIO
app.all('/api/storage/*', async (c) => {
  const path = c.req.path.replace('/api/storage', '');

  await trackUsage(c, 'minio');

  const response = await fetch(`https://minio-backend.blackroad.internal${path}`, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  });

  return new Response(response.body, response);
});

// Admin API

app.get('/admin/users', async (c) => {
  // TODO: Verify admin role

  const users = await c.env.DB.prepare(
    'SELECT id, email, plan, created_at FROM users ORDER BY created_at DESC LIMIT 100'
  ).all();

  return c.json({ users: users.results });
});

app.get('/admin/analytics', async (c) => {
  // TODO: Aggregate usage data

  return c.json({
    totalUsers: 1234,
    activeUsers: 567,
    mrr: 89400, // $89,400/month
    products: {
      vllm: { users: 234, revenue: 23400 },
      keycloak: { users: 456, revenue: 45600 },
      minio: { users: 544, revenue: 20400 },
    },
  });
});

// Billing Webhooks

app.post('/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const payload = await c.req.text();

  // TODO: Verify Stripe signature
  // TODO: Handle subscription events
  // TODO: Update user plan in DB

  return c.json({ received: true });
});

// Helper Functions

async function trackUsage(c, product) {
  const userId = c.get('jwtPayload').sub;
  const timestamp = new Date().toISOString();

  // TODO: Insert usage record into D1
  // await c.env.DB.prepare(
  //   'INSERT INTO usage (user_id, product, timestamp, endpoint, method) VALUES (?, ?, ?, ?, ?)'
  // ).bind(userId, product, timestamp, c.req.path, c.req.method).run();

  // For now, just log
  console.log(`Usage: ${userId} → ${product} → ${c.req.method} ${c.req.path}`);
}

export default app;
