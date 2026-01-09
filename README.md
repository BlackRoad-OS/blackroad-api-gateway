# BlackRoad API Gateway

**Unified API Gateway for all BlackRoad enterprise products**

## Features

✅ **Authentication & Authorization**
- JWT-based authentication
- API key support
- Role-based access control (RBAC)
- Multi-product access management

✅ **Rate Limiting**
- Per-user rate limits
- Tier-based limits (Starter/Pro/Enterprise)
- Per-product rate limits
- Automatic throttling

✅ **Request Routing**
- Intelligent routing to product backends
- Load balancing
- Failover support
- Health checking

✅ **Usage Tracking**
- Request logging
- Usage metrics for billing
- Real-time analytics
- Historical reporting

✅ **Billing Integration**
- Stripe subscription management
- Usage-based billing
- Invoice generation
- Payment processing

## Architecture

```
┌─────────────────────────────────────────────────┐
│          Client Applications                     │
│   (Web, Mobile, API clients)                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│      🖤 BlackRoad API Gateway 🖤                │
│                                                  │
│  ┌────────────────────────────────────────┐   │
│  │  Authentication & Authorization        │   │
│  │  - JWT validation                      │   │
│  │  - API key verification                │   │
│  │  - RBAC                                │   │
│  └────────────────────────────────────────┘   │
│                                                  │
│  ┌────────────────────────────────────────┐   │
│  │  Rate Limiting                         │   │
│  │  - Per-user limits                     │   │
│  │  - Tier-based throttling               │   │
│  └────────────────────────────────────────┘   │
│                                                  │
│  ┌────────────────────────────────────────┐   │
│  │  Request Routing                       │   │
│  │  - Product routing                     │   │
│  │  - Load balancing                      │   │
│  └────────────────────────────────────────┘   │
│                                                  │
│  ┌────────────────────────────────────────┐   │
│  │  Usage Tracking                        │   │
│  │  - Logging                             │   │
│  │  - Metrics                             │   │
│  │  - Billing data                        │   │
│  └────────────────────────────────────────┘   │
│                                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│          Product Backends                        │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  vLLM    │  │ Keycloak │  │  MinIO   │     │
│  │ Backend  │  │ Backend  │  │ Backend  │ ... │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Deployment

```bash
# Deploy to Cloudflare Workers
wrangler login
wrangler deploy

# Set secrets
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put ADMIN_API_KEY
```

## API Endpoints

### Authentication

```bash
# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "plan": "pro"
}
```

### Product APIs (Authenticated)

```bash
# BlackRoad vLLM
POST /api/vllm/v1/completions
Authorization: Bearer <jwt_token>

# BlackRoad Identity
GET /api/identity/users
Authorization: Bearer <jwt_token>

# BlackRoad Storage
POST /api/storage/upload
Authorization: Bearer <jwt_token>
```

### Admin API

```bash
# Get users
GET /admin/users
Authorization: Bearer <admin_jwt_token>

# Analytics
GET /admin/analytics
Authorization: Bearer <admin_jwt_token>
```

### Webhooks

```bash
# Stripe webhook
POST /webhooks/stripe
Stripe-Signature: <signature>
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL, -- 'starter', 'pro', 'enterprise'
  stripe_customer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL, -- 'vllm', 'keycloak', etc.
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due'
  stripe_subscription_id TEXT,
  current_period_start DATETIME,
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Usage tracking table
CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API keys table
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Rate Limits

| Tier       | Requests/Minute | Requests/Day |
|------------|-----------------|--------------|
| Starter    | 60              | 10,000       |
| Pro        | 1,000           | 100,000      |
| Enterprise | Unlimited       | Unlimited    |

## Security

- All requests over HTTPS
- JWT tokens expire after 24 hours
- API keys can be rotated
- Rate limiting prevents abuse
- CORS configured for allowed origins only
- Webhook signatures verified

## Monitoring

- Cloudflare Workers Analytics
- Custom metrics via D1
- Error tracking
- Performance monitoring

## License

**PROPRIETARY** - BlackRoad OS, Inc.

This is proprietary software. Unauthorized copying, distribution, or use is strictly prohibited.

---

**🖤 Built with BlackRoad - Enterprise-grade infrastructure 🛣️**
