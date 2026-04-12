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

## Recent Changes

- 001-p2p-payment-request: Added TypeScript 5.x + Next.js 14+ App Router + Supabase + Playwright

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
