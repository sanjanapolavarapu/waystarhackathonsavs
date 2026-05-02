# Quick Payment Pages (QPP)


> A hosted, full-stack web application that enables providers to create flexible, branded, self-service payment pages — built for the Waystar Hackathon 2026.


**Live App:** `https://waystarhackathonsavs-2bb5.vercel.app/` 
**Demo Admin:** `owner@demo.com` / `owner` 
**Repo:** `https://github.com/sanjanapolavarapu/waystarhackathonsavs`


---


## What is QPP?


Quick Payment Pages are long-lived, self-service online payment experiences. Unlike single-use checkout flows, QPPs are persistent pages that can be reused over time for recurring service payments — think yoga studio class fees, municipal parking payments, nonprofit donations, or event registrations.


**Provider admins** configure pages through an admin portal. **Payers** visit a public URL, fill in custom fields, and complete payment. The system logs every transaction, sends a confirmation email, and surfaces analytics in real time.


### Our Differentiator


Most payment link tools stop at "payment received." QPP includes a full **analytics dashboard** — conversion funnel tracking (visited → started checkout → paid), daily payment volume charts, failed payment rate monitoring, and breakdowns by GL code and payment method. Providers know not just that money moved, but where they're losing payers and why.


---


## Tech Stack


| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS + shadcn/ui | Fast iteration, built-in routing, great DX |
| Backend | Next.js API Routes | Colocated with frontend, no separate server needed |
| Database | Supabase (PostgreSQL) | Instant auth, row-level security, real-time subscriptions |
| Payments | Stripe (sandbox) | Best-in-class sandbox tooling; PaymentElement gives Apple Pay and Google Pay for free |
| Auth | Supabase Auth + JWT (jose) | Password hashing handled by Supabase; session via signed HttpOnly cookie |
| Email | Nodemailer | Lightweight, supports dynamic template variables, Ethereal fallback for dev |
| QR Codes | qrcode (npm) | Client-side PNG and SVG generation |
| Hosting | Vercel | Zero-config Next.js deploys, instant preview URLs |


---


## Architecture


```
Browser (Next.js / Vercel)
       ↕  HTTPS
Next.js API Routes
       ↕
Supabase (PostgreSQL + Auth + RLS)
       ↕
Stripe Sandbox API
       ↕
Nodemailer / SMTP (email confirmations)
```


**Key data flow:**
1. Admin logs in → Supabase Auth issues session → JWT stored in HttpOnly cookie
2. Admin creates/edits payment page → saved to Supabase `payment_pages` table with custom fields
3. Payer visits `/pay/[slug]` → page config fetched from Supabase → Stripe PaymentIntent created
4. Payer completes payment → Stripe confirms → `/api/payments/complete` records transaction in Supabase and sends confirmation email
5. Admin views Reports → transactions queried from Supabase, aggregated client-side for analytics


---


## Features


### Admin Portal
- Create and manage payment pages with unique URL slugs
- Real-time live preview as you configure
- Brand color picker (6 presets + hex display)
- Page title, subtitle, header message, footer message
- Three payment amount modes: Fixed, Min/Max Range, User-Entered
- Up to 10 custom data fields (Text, Number, Dropdown, Date, Checkbox)
- Field ordering with up/down controls
- GL code entry with format validation
- Custom confirmation email subject and body with dynamic variables
- Enable/disable pages without deleting them


### Link Distribution
- One-click copyable public URL per page
- Embeddable iframe snippet — copyable, responsive, mobile-friendly
- QR code — downloadable as PNG or SVG, auto-generated per page


### Payment Processing (Stripe sandbox)
- Credit/debit card via Stripe PaymentElement
- Apple Pay and Google Pay — surfaced automatically by PaymentElement on supported devices
- ACH / bank transfer — supported by Stripe config, UI toggle in roadmap
- Real-time card validation and inline error handling
- Confirmation email sent automatically on successful payment


### Analytics & Reporting (our differentiator)
- Conversion funnel: Visited → Started checkout → Paid
- Conversion rate percentage
- Failed payment rate tracking
- Daily payment volume chart (Sun–Sat)
- Summary stats: total payments, total amount collected, average payment amount
- Breakdown by GL code
- Breakdown by payment method
- CSV export


### Accessibility (WCAG 2.1 AA)
- All form inputs have associated `<label>` elements
- `aria-required` on required fields
- `role="alert"` on error messages
- `aria-label` on all icon-only buttons
- Keyboard navigable end-to-end
- Focus indicators visible on all interactive elements


---


## Setup Instructions


### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (sandbox mode)
- Optional: SMTP credentials for email (falls back to Ethereal test inbox in dev)


### 1. Clone the repo


```bash
git clone https://github.com/sanjanapolavarapu/waystarhackathonsavs.git
cd waystarhackathonsavs
```


### 2. Install dependencies


```bash
npm install
```


### 3. Set up environment variables


```bash
cp .env.example .env.local
```


Fill in your values (see Environment Variables section below).


### 4. Seed demo data


```bash
npm run seed
```


This creates two demo payment pages and an admin user in your Supabase project.


### 5. Run the development server


```bash
npm run dev
```


Open [http://localhost:3000](http://localhost:3000).


### 6. Log in to the admin portal


Navigate to `/admin/login` and use the credentials you set in `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.


---


## Environment Variables


Create a `.env.local` file in the root of the project:


```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key


# Stripe (use sandbox/test keys only — never real keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...


# Auth
ADMIN_AUTH_SECRET=a-long-random-secret-string


# Email (optional — falls back to Ethereal test inbox if not set)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM=qpp@yourdomain.com


# App
NEXT_PUBLIC_BASE_URL=https://your-vercel-url.vercel.app


# Seed script (optional)
SEED_ADMIN_EMAIL=admin@demo.com
SEED_ADMIN_PASSWORD=your-demo-password
```


> **Security note:** Never commit `.env.local` to source control. All secrets are loaded via environment variables — no hardcoded credentials exist in the codebase.


---


## API Endpoints


| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Admin login — returns JWT session cookie |
| `GET` | `/api/auth/logout` | No | Clears session cookie |
| `GET` | `/api/admin/payment-pages` | Yes | List all payment pages for current org |
| `POST` | `/api/admin/payment-pages` | Yes | Create a new payment page |
| `GET` | `/api/admin/payment-pages/[slug]` | Yes | Get a single page with custom fields |
| `PUT` | `/api/admin/payment-pages/[slug]` | Yes | Update a page and its custom fields |
| `GET` | `/api/payment-pages/[slug]` | No | Public — fetch page config for payer view |
| `POST` | `/api/create-payment-intent` | No | Create a Stripe PaymentIntent, persist transaction row |
| `POST` | `/api/payments/complete` | No | Record completed payment, send confirmation email |
| `POST` | `/api/webhooks/stripe` | No (Stripe signature verified) | Handle Stripe webhook events |


---


## Database Schema


### Core Tables


**`payment_pages`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id uuid REFERENCES organizations(id)
slug            text UNIQUE NOT NULL
title           text NOT NULL
subtitle        text
brand_color     text DEFAULT '#6366f1'
logo_url        text
header_message  text
footer_message  text
amount_mode     text CHECK (amount_mode IN ('FIXED', 'RANGE', 'USER_ENTERED'))
fixed_amount    numeric
min_amount      numeric
max_amount      numeric
gl_codes        text[]
email_subject   text
email_template  text
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```


**`custom_fields`**
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
page_id     uuid REFERENCES payment_pages(id) ON DELETE CASCADE
label       text NOT NULL
type        text CHECK (type IN ('TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'CHECKBOX'))
options     text[]
required    boolean DEFAULT false
placeholder text
helper_text text
sort_order  integer DEFAULT 0
```


**`transactions`**
```sql
id                       uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id          uuid REFERENCES organizations(id)
page_id                  uuid REFERENCES payment_pages(id)
stripe_payment_intent_id text UNIQUE
amount                   numeric NOT NULL
currency                 text DEFAULT 'usd'
status                   text CHECK (status IN ('success', 'failed', 'pending'))
payment_method           text CHECK (payment_method IN ('card', 'wallet', 'ach'))
payer_email              text
payer_name               text
custom_responses         jsonb
gl_codes                 text[]
created_at               timestamptz DEFAULT now()
```


**`organizations`**
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
name       text NOT NULL
created_at timestamptz DEFAULT now()
```


**`organization_members`**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id uuid REFERENCES organizations(id)
user_id         uuid REFERENCES auth.users(id)
role            text DEFAULT 'member'
created_at      timestamptz DEFAULT now()
```


---


## Demo Payment Pages


Two pages are pre-configured after running `npm run seed`:


| Page | URL | Amount Mode | Description |
|---|---|---|---|
| Consulting Session | `/pay/consulting-session` | Fixed ($89.00) | Custom fields: Full Name, Service Date, Reference ID |
| Donation | `/pay/donation` | User-Entered | Custom fields: Full Name, Email, Donation Type (dropdown), Subscribe to updates (checkbox) |

---


## Stripe Test Cards


Use these in sandbox mode — no real transactions occur:


| Card | Number | Result |
|---|---|---|
| Visa (success) | `4242 4242 4242 4242` | Payment succeeds |
| Card declined | `4000 0000 0000 0002` | Payment declined |
| Insufficient funds | `4000 0000 0000 9995` | Insufficient funds error |


Use any future expiry date, any 3-digit CVC, and any billing ZIP.


---


## Known Gaps & Honest Notes


- Logo URL field accepts a URL but does not support direct file upload
- The `page_slug` column on the transactions table may require a migration depending on your Supabase schema version — see seed script for the correct column name
- End-to-end tests (Playwright/Cypress) are not included
- Transactions aren't dynamically synced with the database


---


## What We Built — Differentiator Explanation


Our unique feature is **built-in payment analytics**. The reporting page goes beyond a simple transaction list to give providers a full picture of their payment funnel:


- **Conversion funnel** shows how many people visited a page, how many started the checkout form, and how many completed payment — with a live conversion rate percentage
- **Failed payment rate** tracks how many attempts failed so providers can spot patterns and act
- **Daily volume chart** gives a week-at-a-glance view of payment activity
- **GL code and payment method breakdowns** give finance teams the data they need without exporting to a spreadsheet


Most payment link tools stop at "payment received." QPP gives providers the reporting layer their accounting and operations teams actually need — turning a payment link into a payment intelligence platform.


---


## Waystar Hackathon 2026


Built by **SAVS** during the Waystar QPP Hackathon Challenge.


Payment processor: **Stripe** — chosen for best-in-class sandbox tooling, the PaymentElement (which surfaces Apple Pay and Google Pay automatically), and excellent documentation.



