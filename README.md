# QPP — Quick Payment Pages

A hosted, full-stack web application that enables providers to create flexible, branded, self-service payment pages.

---

## Project Description

<!-- Brief description of what QPP does, who it's for, and what makes it unique -->

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js + Tailwind + shadcn | |
| Backend | Next.js API Routes | |
| Database | Supabase (PostgreSQL) | |
| Payments | Stripe (sandbox) | |
| Auth | JWT | |
| Hosting | Vercel + Railway | |
| Email | Resend | |

---

## Architecture

<!-- Add architecture diagram or description here -->

```
Frontend (Next.js / Vercel)
        ↕
Backend API (Next.js API Routes)
        ↕
Database (Supabase / PostgreSQL)
        ↕
Stripe Sandbox
```

---

## Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```env
# Database
DATABASE_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Demo/admin
SUPABASE_DEFAULT_ADMIN_ID=

# Auth
JWT_SECRET=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_BASE_URL=
```

---

## Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/your-org/qpp-hackathon.git
cd qpp-hackathon

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your values in .env.local

# 4. Run database migrations
# (add migration command here)

# 5. Run the development server
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Admin login |
| GET | `/api/pages` | Yes | List all payment pages |
| POST | `/api/pages` | Yes | Create a payment page |
| PUT | `/api/pages/:id` | Yes | Update a payment page |
| PATCH | `/api/pages/:id/toggle` | Yes | Enable / disable a page |
| GET | `/api/pages/:slug/public` | No | Fetch public page config |
| POST | `/api/pages/:id/fields` | Yes | Add a custom field |
| PUT | `/api/fields/:id` | Yes | Update a custom field |
| DELETE | `/api/fields/:id` | Yes | Delete a custom field |
| POST | `/api/transactions` | No | Record a completed payment |
| GET | `/api/transactions` | Yes | List transactions with filters |
| GET | `/api/reports/summary` | Yes | Total count, amount, average |
| GET | `/api/reports/by-gl` | Yes | Breakdown by GL code |

---

## Database Schema

See [`schema.sql`](./schema.sql) for the full schema.

### Core Tables

- **AdminUser** — Admin portal users
- **PaymentPage** — Payment page configurations
- **CustomField** — Custom fields attached to each page
- **Transaction** — Payment records
- **FieldResponse** — Custom field values per transaction
- **PageVisit** — Visit tracking for analytics (conversion funnel)

---

## Demo Credentials

```
Email:    admin@demo.com
Password: (set before demo)
```

**Hosted URL:** <!-- add before demo -->
**Repo URL:** <!-- add before demo -->

---

## What We Built

<!-- Fill in after demo — differentiator feature explanation -->

## Known Gaps / Honest Notes

<!-- Fill in before demo — what we didn't finish and why -->
