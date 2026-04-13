# PayRequest — P2P Payment Request App

## Overview

PayRequest is a consumer fintech web app that lets users send money requests to anyone via email or phone number. The recipient receives a shareable link, logs in, and pays or declines — no complex setup required. Built for individuals who need a lightweight, fast way to split bills, collect payments, or request funds from contacts.

## Live Demo

**URL**: https://payrequest-three.vercel.app

| Account | Email | Password |
|---------|-------|----------|
| User 1 | demo1@payrequest.test | DemoPass123! |
| User 2 | demo2@payrequest.test | DemoPass123! |

> Log in as User 1, create a request to User 2's email, then open an incognito window and log in as User 2 to see the full recipient flow.

## Features

- **Create payment requests** — specify recipient by email or international phone number (country selector with 36 countries)
- **Dashboard** — Sent and Received tabs with status filter and email search
- **Full request lifecycle** — Pay, Decline, or Cancel with confirmation dialogs
- **7-day automatic expiration** — live countdown timer on each request
- **Shareable links** — send `/request/{uuid}` to anyone; unauthenticated users see masked sender info
- **Audit trail** — every status transition and auth event is logged immutably
- **Session security** — 30-minute inactivity timeout, login rate limiting (5 attempts → 15-minute lockout)
- **Mobile-responsive** — dark fintech UI, works on all screen sizes

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 (App Router) | Full-stack React framework — server components, server actions |
| TypeScript (strict) | End-to-end type safety |
| Supabase | PostgreSQL database + Auth + Row Level Security |
| Tailwind CSS + shadcn/ui | Dark-theme design system and UI components |
| Zod + react-hook-form | Client and server-side validation |
| Playwright | E2E testing — 49 tests with video recording |
| Vercel | Deployment and hosting |

## AI Tools Used

This project was built using a spec-driven development workflow powered by AI:

- **[Spec-Kit](https://github.com/your-org/spec-kit)** — structured specification workflow: `/specify` → `/plan` → `/tasks` → `/implement`
- **[Claude Code](https://claude.ai/code)** — AI coding agent for implementation, test writing, and debugging

All specification artifacts are committed to the repo under `specs/`:

| Artifact | Description |
|----------|-------------|
| `specs/001-p2p-payment-request/spec.md` | Full feature specification with user stories and acceptance criteria |
| `specs/001-p2p-payment-request/plan.md` | Technical architecture and implementation plan |
| `specs/001-p2p-payment-request/tasks.md` | Task breakdown used during implementation |
| `.specify/memory/constitution.md` | Project principles and non-negotiable engineering constraints |

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup

```bash
git clone https://github.com/furkanadiiguzel/payrequest.git
cd payrequest
npm install

# Copy the example env file and fill in your Supabase credentials
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOGIN_MAX_FAILURES=5
LOGIN_LOCKOUT_MINUTES=15
```

```bash
npm run dev
# App running at http://localhost:3000
```

### Database Setup

Run the 5 migration files in order in your **Supabase SQL Editor** (`Database → SQL Editor`):

```
supabase/migrations/20260410_001_create_profiles.sql
supabase/migrations/20260410_002_create_payment_requests.sql
supabase/migrations/20260410_003_create_audit_logs.sql
supabase/migrations/20260410_004_create_login_attempts.sql
supabase/migrations/20260410_005_rls_policies.sql
```

Then in **Supabase → Authentication → URL Configuration**, set:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/**`

## Running E2E Tests

```bash
# Install Playwright browser
npx playwright install chromium

# Start the dev server (tests need it running)
npm run dev &

# Run all 49 tests (videos saved on failure)
npx playwright test

# Interactive UI mode
npx playwright test --ui

# View HTML report
npx playwright show-report
```

Test files are in `tests/e2e/`. Videos and screenshots are saved to `playwright-report/` on failure.

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # /login, /signup — no navbar
│   │   ├── login/
│   │   └── signup/
│   ├── (protected)/         # /dashboard, /request/new — requires auth
│   │   ├── dashboard/
│   │   └── request/new/
│   └── request/[id]/        # Public shareable link — auth + unauth views
├── actions/
│   ├── auth.ts              # loginAction, signupAction, logoutAction
│   └── requests.ts          # createRequest, payRequest, declineRequest, cancelRequest
├── components/
│   ├── PhoneInput.tsx        # Country selector + number input (E.164)
│   ├── ExpiryCountdown.tsx   # Live countdown timer
│   ├── StatusBadge.tsx       # Colored status pill
│   ├── IdleTimer.tsx         # 30-min inactivity session timeout
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── supabase/            # client.ts, server.ts, middleware.ts, service.ts
│   ├── audit.ts             # writeAuditLog — service role only
│   ├── countries.ts         # 36-country dial code list
│   ├── currency.ts          # centsToDollars formatter
│   ├── mask.ts              # maskEmail for unauthenticated views
│   ├── phone.ts             # E.164 validation
│   ├── requests.ts          # Data fetching + applyExpiryToRequest
│   └── validations/         # Zod schemas (auth.ts, request.ts)
├── middleware.ts             # Session refresh + route protection
└── types/database.ts        # TypeScript interfaces for DB entities

supabase/migrations/         # 5 ordered SQL files — run once on new project
tests/
├── e2e/                     # 7 Playwright spec files (49 tests total)
├── pages/                   # Page Object Models
├── helpers/                 # auth.ts, db.ts, seed.ts
└── global-setup.ts          # Creates seed users before test run
specs/
└── 001-p2p-payment-request/ # Spec-kit artifacts (spec, plan, tasks)
```

## Design Decisions

1. **Integer cents for amounts** — all monetary values stored as `integer` cents in the DB; formatted to `$XX.XX` only at render time. Eliminates floating-point precision bugs common in fintech.

2. **Row Level Security (RLS)** — access control enforced at the database layer, not just the application layer. A compromised server action cannot leak another user's requests; Supabase RLS policies block the query itself.

3. **Expiry check on read, not by cron** — no background job needed. `applyExpiryToRequest()` checks `expires_at < now()` on every fetch and returns `status: 'expired'` in memory. The DB is updated lazily only when a status-change action is attempted on an expired request.

4. **Server actions for all mutations** — `payRequest`, `declineRequest`, `cancelRequest`, and `createRequest` are Next.js server actions. They re-validate the caller's identity via `supabase.auth.getUser()` on every call — the client never passes a user ID that the server trusts.

5. **Service role client isolated to server** — `SUPABASE_SERVICE_ROLE_KEY` is only imported in server actions and lib files. It is never in a `NEXT_PUBLIC_` variable and never reaches the client bundle.

6. **E.164 for phone numbers** — all phone numbers stored as `+{countryCode}{number}` (e.g., `+905321234567`). Unambiguous, internationally portable, and easy to validate with a single regex.
