# BoringMoney

BoringMoney is a deployable Express application that serves the current custom HTML UI, persists subscribers and advertiser inquiries to Supabase Postgres, protects the backend with rate limits and security headers, and includes admin/export and notification hooks for production use. SQLite remains available as a local fallback for development and tests.

## Stack

- Node.js
- Express
- Supabase Postgres via `pg`
- SQLite via `node:sqlite` fallback
- Vanilla JavaScript
- Nodemailer for optional ops notifications
- Razorpay Checkout for microgreens payments
- Cloudflare Turnstile for optional bot protection
- Sentry for optional backend monitoring

## What is implemented

- Custom UI served directly from the root HTML files through Express routes
- Newsletter signup backend with validation, deduplication, Supabase/Postgres persistence, and async frontend submission
- Advertiser inquiry backend with validation and Supabase/Postgres persistence
- Razorpay-backed microgreens checkout with server-side order creation and signature verification
- Global rate limiting across all endpoints, plus stricter limits for signup and inquiry endpoints
- Optional Turnstile verification on subscriber and inquiry endpoints
- Admin-protected dashboard and CSV exports for subscribers and inquiries
- `/health`, `/ready`, and JSON API endpoints
- Optional Sentry exception capture for request and process-level failures
- Local Matter.js serving for the homepage so the app no longer depends on a runtime CDN script
- Dockerfile, Supabase schema, and `render.yaml` for deployment

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy env vars:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

If `3000` is occupied:

```bash
PORT=3100 npm run dev
```

## Environment variables

Required:

- `PORT`

Required for production database persistence:

- `DATABASE_URL` for Supabase/Postgres

Local fallback (dev/test):

- `SQLITE_PATH`

Recommended for production:

- `TRUST_PROXY=1`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Optional email notifications:

- `NOTIFY_EMAIL`
- `FROM_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

Optional bot protection:

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Optional payments:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Optional monitoring:

- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE` (0 to 1)

If SMTP settings are omitted, the app still works, but new subscribers and inquiries will not trigger email alerts.

## Supabase setup

1. Create a Supabase project.
2. Copy the Postgres connection string into `DATABASE_URL`.
3. Use the direct database connection string with `?sslmode=require`.
4. Optionally run [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL editor. The app also creates the required tables automatically on first boot.

## Endpoints

Pages:

- `GET /`
- `GET /about`
- `GET /issues`
- `GET /issues/car-washes`
- `GET /playbooks`
- `GET /community`
- `GET /subscribe`
- `GET /advertise`
- `GET /marketplace`
- `GET /boring-score`

Operational:

- `GET /health`
- `GET /ready`
- `GET /api/health`
- `GET /api/runtime-config`
- `POST /api/payments/razorpay/order`
- `POST /api/payments/razorpay/verify`

API:

- `GET /api/issues`
- `GET /api/issues/:slug`
- `GET /api/playbooks`
- `POST /api/subscribers`
- `POST /api/inquiries`

Admin:

- `GET /admin`
- `GET /admin/subscribers.csv`
- `GET /admin/inquiries.csv`

Admin endpoints require HTTP Basic Auth and are only enabled when `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set.

## Payloads

`POST /api/subscribers`

```json
{
  "firstName": "Dennis",
  "email": "dennis@example.com",
  "source": "home-hero",
  "company": ""
}
```

`POST /api/inquiries`

```json
{
  "name": "Acme",
  "email": "ads@example.com",
  "company": "Acme Co",
  "message": "We want a four week sponsorship package.",
  "source": "advertise-page",
  "website": ""
}
```

The `company` field on subscribers and `website` field on inquiries act as honeypots and should remain empty.

## Deployment

### Docker

```bash
docker build -t boring-money .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require' \
  boring-money
```

### Render

`render.yaml` is included for a free Node web service with:

- health check on `/ready`
- `DATABASE_URL` wired as a secret env var
- no persistent disk requirement

Set `DATABASE_URL`, admin credentials, and any SMTP secrets in Render before going live.
Set Turnstile, Razorpay, and Sentry env vars only if you enable those integrations.

## Test

```bash
npm test
```
