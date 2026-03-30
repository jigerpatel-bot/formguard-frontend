# FormGuard — Complete Setup Guide

## Project Structure

```
formguard/
├── formguard-backend/     ← Node.js + Express + PostgreSQL API
└── formguard-frontend/    ← React + Vite web app
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (download from nodejs.org)
- PostgreSQL 14+ (download from postgresql.org)

---

## Step 1 — Backend Setup

```bash
cd formguard-backend
npm install
```

### Configure environment
```bash
cp .env.example .env
```

Open `.env` in VS Code and fill in your values:

| Variable | Where to find it |
|----------|-----------------|
| `DATABASE_URL` | Your local PostgreSQL connection string |
| `JWT_SECRET` | Make up any long random string (32+ chars) |
| `ENCRYPTION_KEY` | Make up a 64-char hex string |
| `DROPBOX_SIGN_API_KEY` | app.hellosign.com → Settings → API |
| `DROPBOX_SIGN_CLIENT_ID` | app.hellosign.com → API → Embedded → Create app |
| `RESEND_API_KEY` | resend.com → API Keys → Create |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys → Create |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → Webhooks → Add endpoint |

### Create database
```bash
psql -U postgres -c "CREATE DATABASE formguard;"
```

### Run all migrations (run in order)
```bash
node src/db/migrate.js
node src/db/migrate2.js
node src/db/migrate3.js
node src/db/migrate4.js
node src/db/migrate5.js
node src/db/migrate6.js
```

### Seed development data
```bash
npm run seed
# Creates: admin@acme.com / Admin1234!
```

### Start backend
```bash
npm run dev
# Runs on http://localhost:3001
```

---

## Step 2 — Frontend Setup

```bash
cd formguard-frontend
npm install
```

### Configure environment
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_DROPBOX_SIGN_CLIENT_ID=your_client_id_here
```

### Start frontend
```bash
npm run dev
# Runs on http://localhost:5173
```

---

## Step 3 — Open in browser

Go to: **http://localhost:5173**

Login with: **admin@acme.com / Admin1234!**

---

## How the two apps work together

```
Browser (localhost:5173)
       ↓  API calls
Backend (localhost:3001)
       ↓  queries
PostgreSQL (localhost:5432)
```

The Vite dev server automatically proxies `/api/*` requests to the backend, so you don't need to worry about CORS during development.

---

## Key flows to test locally

### 1. Owner signup
- Go to http://localhost:5173/signup
- Create an account with any email/password
- Complete the 4-step wizard

### 2. Employee onboarding
After inviting an employee, check the backend logs for the invite URL (email won't send locally without Resend configured). It will look like:
```
http://localhost:5173/onboard?token=abc123...
```
Open this URL to complete the employee onboarding flow.

### 3. Write-up acknowledgment
After creating and sending a write-up, check backend logs for the acknowledgment URL:
```
http://localhost:5173/writeup-response?token=abc123...
```

---

## API Reference (Backend)

All endpoints require `Authorization: Bearer <jwt>` header except:
- `POST /api/auth/register`
- `POST /api/auth/login`
- Any `?token=` employee-facing endpoints

### Key endpoints

```
Auth:           POST /api/auth/register
                POST /api/auth/login
                GET  /api/auth/me

Businesses:     GET  /api/businesses
                POST /api/businesses
                POST /api/businesses/:id/switch

Employees:      GET  /api/employees
                POST /api/employees/invite
                GET  /api/employees/:id

Onboarding:     GET  /api/onboarding
                GET  /api/onboarding/:employeeId
                POST /api/onboarding/:employeeId/remind

Forms:          POST /api/forms/w4?token=
                POST /api/forms/i9/section1?token=
                POST /api/forms/i9/:id/section2

Write-ups:      GET  /api/writeups
                POST /api/writeups/:employeeId
                POST /api/writeups/:writeupId/send
                GET  /api/writeups/acknowledge?token=
                POST /api/writeups/acknowledge?token=

Compliance:     GET  /api/compliance/ice/data
                POST /api/compliance/ice/generate
                GET  /api/compliance/eeoc/report

Timeline:       GET  /api/timeline/:employeeId
                POST /api/timeline/:employeeId/sync

AI Draft:       POST /api/writeups/:employeeId/ai-draft
```

---

## Common issues & fixes

### "Cannot connect to database"
Make sure PostgreSQL is running:
```bash
# Mac
brew services start postgresql
# or
pg_ctl -D /usr/local/var/postgres start
```

### "JWT_SECRET not set"
Make sure your `.env` file is in the `formguard-backend/` folder and has `JWT_SECRET=` set.

### "Port already in use"
```bash
# Kill whatever is on port 3001
lsof -ti:3001 | xargs kill -9
# Kill whatever is on port 5173
lsof -ti:5173 | xargs kill -9
```

### Frontend shows blank page
Open browser console (F12). Usually means an API call failed. Check the backend is running on port 3001.

### Emails not sending
If `RESEND_API_KEY` is not set, emails are skipped silently. The invite URL is logged to the backend console instead — check terminal output.

---

## Environment variables reference

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/formguard

# Auth
JWT_SECRET=any_long_random_string_at_least_32_chars
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173
APP_BASE_URL=http://localhost:5173

# Invite links
INVITE_TOKEN_EXPIRES_HOURS=72

# Encryption (SSN storage)
ENCRYPTION_KEY=64_hex_chars

# Dropbox Sign
DROPBOX_SIGN_API_KEY=your_api_key
DROPBOX_SIGN_CLIENT_ID=your_client_id
DROPBOX_SIGN_W4_TEMPLATE_ID=optional
DROPBOX_SIGN_I9_TEMPLATE_ID=optional

# Email (Resend)
RESEND_API_KEY=re_your_key
FROM_EMAIL=noreply@yourdomain.com

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-your_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_DROPBOX_SIGN_CLIENT_ID=your_client_id
VITE_APP_NAME=FormGuard
```

---

## What's next — Step 9 (Deployment)

When ready to go live, you'll need:
1. Railway account (hosts backend + PostgreSQL)
2. Vercel account (hosts frontend)
3. Domain from Hostinger
4. All API keys from their respective dashboards

Step 9 will walk through deployment one click at a time.
