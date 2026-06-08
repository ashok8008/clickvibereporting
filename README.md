# ClickVibe — Affiliate Tracking Platform

Full-stack affiliate tracking and publisher management for prediction-market and sports-betting
advertisers (first advertiser: **Polymarket**). Two roles — **Admin** (internal team) and
**Publisher** (media companies with one or more sites). Tracks installs/conversions via the
AppsFlyer Pull API (daily cron) and manual CSV upload from advertiser dashboards.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom ClickVibe design system (Inter font, navy/indigo palette)
- **MongoDB** via **Mongoose**
- **NextAuth.js** (credentials provider, JWT sessions)
- **react-hook-form + zod** forms, **react-dropzone + papaparse** CSV, **Recharts** charts
- **Resend** email wrapper (optional)

## Prerequisites

- Node.js 18+ (tested on Node 24)
- A MongoDB instance. Options:
  - Local: install MongoDB Community Server, run `mongod` (defaults to `mongodb://localhost:27017`)
  - Docker: `docker run -d -p 27017:27017 --name clickvibe-mongo mongo:7`
  - Hosted: MongoDB Atlas — copy the connection string into `DATABASE_URL`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# then edit .env.local — at minimum set NEXTAUTH_SECRET (openssl rand -base64 32)
# and DATABASE_URL if not using the local default.

# 3. Seed the database (admin user, Polymarket offer, TFM Media publisher, sites, sample data)
npm run seed

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## Demo Credentials

| Role      | Email                    | Password   |
| --------- | ------------------------ | ---------- |
| Admin     | admin@clickvibe.ai       | `June@123`  |
| Publisher | chintan@origami.dev      | `Origami@1` |

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | MongoDB connection string |
| `NEXTAUTH_SECRET` | Session signing secret (required) |
| `NEXTAUTH_URL` | App base URL (`http://localhost:3000` locally) |
| `NEXT_PUBLIC_APP_URL` | Dashboard URL in credential emails (`https://app.clickvibe.ai` in prod) |
| `NEXT_PUBLIC_TRACKING_BASE_URL` | Base URL used to build `/c/{linkId}` redirect links |
| `RESEND_API_KEY` | Resend key (leave blank — email sending becomes a no-op) |
| `APPSFLYER_API_TOKEN` | AppsFlyer Pull API V2 token (**never commit**) |
| `APPSFLYER_DEFAULT_APP_ID` | Default AppsFlyer app id (`id6648798962`) |
| `CRON_SECRET` | Secret to authorize the daily sync cron request |

> Never commit real `APPSFLYER_API_TOKEN` or `RESEND_API_KEY` values. `.env.local` is gitignored.

## Key Features

- **Auth & RBAC** — `middleware.ts` protects `/admin/*` (ADMIN) and `/publisher/*` (PUBLISHER),
  redirecting by role after login.
- **Admin dashboard** — KPI cards, quick nav, recent conversions, AppsFlyer sync status,
  featured offers (no news).
- **Offers** — CRUD with create/edit modal; AppsFlyer App ID required; active/paused toggle.
- **Publishers** — list + multi-step onboarding modal (info → credentials → sites) and a tabbed
  detail page (Media Sites, Assigned Offers, Tracking Links, Performance). Sites auto-receive the
  next palette color.
- **Tracking links** — set `DIRECT` or `CONVERTED` per site × offer at onboarding. Mode locks
  after creation; CONVERTED links generate a stored `/c/{linkId}` redirect and log clicks.
- **Reporting** — filters, KPI row, rollup table (site → publisher subtotal → grand total),
  Recharts line + bar charts, CSV export. Publisher view is scoped to their own data.
- **CSV upload** — drag & drop, server-side parse, promo-code → site match preview, duplicate
  detection (skip/overwrite), import as conversions.
- **AppsFlyer** — sync history + manual "Sync Now"; daily cron at 06:00 UTC via `vercel.json`.
- **Click redirect** — `/c/[linkId]` logs a click then 302-redirects to the advertiser URL.

## Project Structure

```
app/                 App Router pages, API routes, /c redirect handler
components/          ui/ primitives, layout/, shared/, admin/, charts/
lib/                 db, auth, reporting, dashboard, csv-parser, appsflyer, email, tracking…
models/              Mongoose schemas + enums
scripts/seed.ts      Database seed
designs/             Original HTML mockups (reference)
vercel.json          Daily AppsFlyer cron
```

## Notes

- The floating chatbot is static UI (canned replies) — ready to be wired to a real assistant later.
- News features from the original mockups are intentionally excluded.
