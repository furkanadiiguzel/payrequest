# PayRequest Development Guidelines

Auto-generated from feature plan. Last updated: 2026-04-10

## Active Technologies

- TypeScript 5.x + Next.js 14+ App Router (001-p2p-payment-request)
- Tailwind CSS + shadcn/ui (001-p2p-payment-request)
- Supabase (PostgreSQL + Auth + @supabase/ssr) (001-p2p-payment-request)
- Playwright E2E (001-p2p-payment-request)

## Project Structure

```text
src/
├── app/
│   ├── (auth)/          # login, signup — no navbar
│   ├── (protected)/     # dashboard, /request/new — with navbar
│   └── request/[id]/    # public route — auth + unauth viewers
├── actions/             # Server actions (auth.ts, requests.ts)
├── components/          # StatusBadge, IdleTimer, shadcn/ui
├── lib/
│   ├── supabase/        # client.ts, server.ts, middleware.ts, service.ts
│   ├── audit.ts         # writeAuditLog — service role only
│   ├── currency.ts      # centsToDollars
│   ├── mask.ts          # maskEmail
│   ├── phone.ts         # normalizePhone
│   ├── requests.ts      # fetchSentRequests, fetchReceivedRequests, applyExpiryToRequest
│   └── validations/     # Zod schemas (auth.ts, request.ts)
└── types/database.ts    # PaymentRequest, Profile, AuditLog interfaces

supabase/migrations/     # 5 ordered SQL migration files
tests/
├── e2e/                 # 6 Playwright spec files
├── pages/               # Page Object Models
├── helpers/             # auth.ts, db.ts, seed.ts
└── global-setup.ts      # Seed users via Supabase Admin API
```

## Commands

```bash
npm run dev              # Dev server on :3000
npm run build            # Production build + type check
npx playwright test      # Full E2E suite (requires dev server running)
npx playwright test --ui # Interactive Playwright debugger
```

## Code Style

- TypeScript strict mode — no `any`, no non-null assertions without justification
- Server components fetch data; client components handle interaction
- Server actions re-validate identity via `supabase.auth.getUser()` — never trust client-passed user IDs
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never in `NEXT_PUBLIC_` variables, never in client components
- Amounts are always integer cents in the DB and in server action parameters; format to `$XX.XX` only at display time
- All `data-testid` attributes are required on interactive elements referenced by Playwright tests

## Design System — Always-Dark Fintech Theme

PayRequest uses a **permanent dark UI** with no light mode. The `dark` class is always set on `<html>`.

**Rules (enforced):**
- Never use hardcoded Tailwind color classes: `bg-white`, `bg-gray-50`, `bg-gray-100`, `text-gray-900`, `text-gray-500`, `text-indigo-600`, `bg-red-50`, `text-red-700`, `border-gray-200`
- Always use semantic CSS tokens:
  - Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-accent`
  - Text: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive`
  - Borders: `border-border`
  - Errors: `bg-destructive/10 text-destructive`
  - Brand links: `text-primary hover:text-primary/80`
  - Overlays: `bg-background/95 backdrop-blur-sm`

**Status badge classes:**
- `pending` → `bg-amber-500/15 text-amber-300`
- `paid` → `bg-emerald-500/15 text-emerald-300`
- `declined` → `bg-red-500/15 text-red-300`
- `expired`/`cancelled` → `bg-slate-500/15 text-slate-400`

**Key UI components:**
- `src/components/ExpiryCountdown.tsx` — live countdown (updates every 1s), urgency color at <24h (amber) and <2h (red)
- `src/components/AnimatedCheck.tsx` — SVG checkmark with `check-draw` + `pop-scale` CSS animations
- Dashboard stats bar with 4 `StatCard`s (pending sent/received counts + amounts, total counts)
- `RequestCard` has left accent bar keyed to status + hover glow via `hover:shadow-[0_0_16px_...]`
- `RequestForm` shows floating particle dots during submission (`particle-float` keyframe)
- `PaymentSuccessOverlay` has 8 CSS confetti particles in different colors/trajectories

**Color tokens (defined in `src/app/globals.css`):**
- `--background`: `oklch(0.09 0.016 264)` — deep blue-black
- `--card`: `oklch(0.13 0.014 264)` — dark surface
- `--primary`: `oklch(0.61 0.22 264)` — indigo brand
- `--muted-foreground`: `oklch(0.52 0.03 264)` — secondary text
- `--destructive`: `oklch(0.60 0.22 27)` — red
- `--border`: `oklch(0.23 0.022 264)`

## Recent Changes

- 001-p2p-payment-request: Dark fintech theme applied (2026-04-12) — always-dark with oklch palette
- 001-p2p-payment-request: Added TypeScript 5.x + Next.js 14+ App Router + Supabase + Playwright

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
