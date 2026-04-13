# Quickstart: PayRequest Development Setup

**Feature**: 001-p2p-payment-request | **Date**: 2026-04-10

---

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase account (free tier sufficient for MVP)
- A Vercel account (for deployment; local dev uses `npm run dev`)

---

## 1. Bootstrap the Next.js Project

From the repo root (currently a bare git repo with spec files):

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint \
  --yes
```

> If `create-next-app` rejects a non-empty directory, scaffold in `/tmp/payrequest-scaffold` then copy `src/`, `public/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, and `next.config.ts` into the repo root.

---

## 2. Install Additional Dependencies

```bash
# Runtime
npm install @supabase/ssr @supabase/supabase-js \
            date-fns \
            react-hook-form @hookform/resolvers zod

# Dev / Test
npm install -D playwright @playwright/test
npx playwright install --with-deps chromium
```

---

## 3. Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
# Prompts:
#   Style: Default
#   Base color: Slate
#   CSS variables: Yes
#   Tailwind config: Yes

# Install all components used by this feature
npx shadcn-ui@latest add card button input label badge dialog tabs sonner
```

---

## 4. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note: **Project URL**, **Anon key**, **Service role key** (from Settings > API)
3. In Auth > Sessions: set JWT expiry = `3600`, Refresh token expiry = `28800`

---

## 5. Configure Environment Variables

Create `.env.local` (gitignored):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOGIN_MAX_FAILURES=5
LOGIN_LOCKOUT_MINUTES=15
```

> `SUPABASE_SERVICE_ROLE_KEY` must NEVER be prefixed with `NEXT_PUBLIC_`. It is server-only.

---

## 6. Run Database Migrations

In the Supabase dashboard → SQL Editor, run each migration file **in order**:

```
supabase/migrations/20260410_001_create_profiles.sql
supabase/migrations/20260410_002_create_payment_requests.sql
supabase/migrations/20260410_003_create_audit_logs.sql
supabase/migrations/20260410_004_create_login_attempts.sql
supabase/migrations/20260410_005_rls_policies.sql
```

**Critical verification after migration 001**: In the SQL Editor, run:
```sql
-- Simulate what the trigger does
SELECT * FROM profiles;
-- Should be empty. Now create a test user in Auth > Users,
-- then check profiles again — a row should appear automatically.
```

If the trigger does not fire, check `handle_new_user()` function exists in Database > Functions.

---

## 7. Run the Dev Server

```bash
npm run dev
```

Navigate to `http://localhost:3000` — you should be redirected to `/login`.

---

## 8. Run E2E Tests

The test suite requires the dev server to be running and a Supabase project with migrations applied.

```bash
# In one terminal:
npm run dev

# In another:
npx playwright test --reporter=list
```

Test videos are saved to `playwright-report/`. Screenshots are saved on failure only.

---

## Key Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build (type-check included) |
| `npm run typecheck` | Run TypeScript compiler without emitting |
| `npx playwright test` | Run full E2E suite |
| `npx playwright test --ui` | Playwright UI mode (interactive debugging) |
| `npx playwright test tests/e2e/auth.spec.ts` | Run single spec file |

---

## Design System — Rebuild Instructions

This section is **required reading** when regenerating the UI from specs. The design system is locked and must be reproduced exactly.

### Theme: Always-Dark Fintech

```css
/* src/app/globals.css — override the shadcn/ui defaults */
:root,
.dark {
  color-scheme: dark;
  --background:   oklch(0.09 0.016 264);   /* deep blue-black */
  --foreground:   oklch(0.93 0.008 264);   /* near-white, blue tint */
  --card:         oklch(0.13 0.014 264);   /* dark card surface */
  --card-foreground: oklch(0.93 0.008 264);
  --popover:      oklch(0.13 0.014 264);
  --popover-foreground: oklch(0.93 0.008 264);
  --primary:      oklch(0.61 0.22 264);    /* indigo-500 brand */
  --primary-foreground: oklch(0.99 0 0);
  --secondary:    oklch(0.18 0.018 264);
  --secondary-foreground: oklch(0.93 0.008 264);
  --muted:        oklch(0.18 0.018 264);
  --muted-foreground: oklch(0.52 0.03 264);
  --accent:       oklch(0.21 0.02 264);
  --accent-foreground: oklch(0.93 0.008 264);
  --destructive:  oklch(0.60 0.22 27);     /* red */
  --border:       oklch(0.23 0.022 264);
  --input:        oklch(0.16 0.016 264);
  --ring:         oklch(0.61 0.22 264);
  --radius: 0.625rem;
}
```

The `dark` class MUST be set unconditionally on `<html>` in `src/app/layout.tsx`:
```tsx
<html lang="en" className={`${fonts} dark`}>
```

### Required CSS Animations (add to globals.css)

```css
@keyframes check-draw   { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@keyframes pop-scale    { 0% { transform: scale(0); opacity: 0; } 65% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
@keyframes ring-expand  { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2.4); opacity: 0; } }
@keyframes slide-in-up  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes particle-float { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-72px) scale(0.3); } }
@keyframes glow-pulse   { 0%, 100% { box-shadow: 0 0 0 0 oklch(0.61 0.22 264 / 0.45); } 50% { box-shadow: 0 0 18px 4px oklch(0.61 0.22 264 / 0); } }
@keyframes fade-in      { from { opacity: 0; } to { opacity: 1; } }
/* Confetti: confetti-a through confetti-e with different translate directions */
```

### Semantic Token Rules (NEVER use hardcoded colors)

| Don't use | Use instead |
|-----------|-------------|
| `bg-white`, `bg-gray-50/100` | `bg-background`, `bg-card`, `bg-muted` |
| `text-gray-900`, `text-gray-700` | `text-foreground` |
| `text-gray-500`, `text-gray-400` | `text-muted-foreground` |
| `text-indigo-600` | `text-primary` |
| `hover:text-indigo-500` | `hover:text-primary/80` |
| `border-gray-200` | `border-border` |
| `bg-red-50 text-red-700` | `bg-destructive/10 text-destructive` |
| `text-red-600` | `text-destructive` |

### Status Badge Classes

```tsx
pending:   'bg-amber-500/15 text-amber-300'
paid:      'bg-emerald-500/15 text-emerald-300'
declined:  'bg-red-500/15 text-red-300'
expired:   'bg-slate-500/15 text-slate-400'
cancelled: 'bg-slate-500/15 text-slate-400' + strikethrough span
```

### Component Architecture Notes

- `src/components/ExpiryCountdown.tsx` — client component, live countdown with urgency colors
- `src/components/AnimatedCheck.tsx` — SVG checkmark with `check-draw` + `pop-scale` animations
- Dashboard has a stats bar (4 `StatCard` components: pending sent/received, total sent/received)
- `RequestCard` has a left-side colored accent bar keyed to status, plus hover glow
- `RequestForm` has particle animation on submit button during sending state
- `SuccessScreen` uses `AnimatedCheck` with ring-expand pulse behind it
- `PaymentSuccessOverlay` has CSS confetti particles in 5 colors

---

## Architecture Quick Reference

| Concern | Location |
|---------|----------|
| Route protection | `src/middleware.ts` |
| Session refresh | `src/middleware.ts` (via `@supabase/ssr`) |
| Auth server actions | `src/actions/auth.ts` |
| Request server actions | `src/actions/requests.ts` |
| Audit log writes | `src/lib/audit.ts` (service role) |
| Expiry logic | `src/lib/requests.ts → applyExpiryToRequest()` |
| Email masking | `src/lib/mask.ts → maskEmail()` |
| Phone normalization | `src/lib/phone.ts → normalizePhone()` |
| Currency display | `src/lib/currency.ts → centsToDollars()` |
| Idle timer (session) | `src/components/IdleTimer.tsx` |
| DB migrations | `supabase/migrations/` |

---

## Deployment (Vercel)

1. Connect the GitHub repo to Vercel
2. Set all environment variables from `.env.local` in Vercel dashboard (Project > Settings > Environment Variables)
3. `NEXT_PUBLIC_APP_URL` should be set to the production domain (e.g., `https://payrequest.vercel.app`)
4. Vercel auto-detects Next.js — no `vercel.json` needed for MVP
5. Push to `main` → Vercel deploys automatically
