# PayRequest Constitution

## Core Principles

### I. Money as Integer Cents (NON-NEGOTIABLE)
All monetary amounts are stored and passed as integer cents (e.g., $25.00 = 2500). Conversion to display format (`$XX.XX`) happens only at render time via `centsToDollars()`. Never store or pass floats for money. Use `Math.round(parseFloat(amount) * 100)` for input conversion.

### II. Server-Only Identity (NON-NEGOTIABLE)
Server actions and API routes MUST call `supabase.auth.getUser()` to establish the caller's identity. Never accept user IDs from client-passed form data or request bodies. The `SUPABASE_SERVICE_ROLE_KEY` is server-only — never in `NEXT_PUBLIC_` variables, never imported in client components.

### III. Immutable Audit Trail
All status transitions and authentication events MUST be written to `audit_logs` via `writeAuditLog()` using the service role client. The audit log table has INSERT-only RLS — no UPDATE or DELETE is ever granted. This log must survive even if a user is deleted (no FK constraint on `actor_id`).

### IV. Dark Fintech UI (NON-NEGOTIABLE)
PayRequest uses a **permanent dark theme** with no light mode. Implementation rules:
- Set `class="dark"` unconditionally on `<html>` in `src/app/layout.tsx`
- All colors defined via CSS custom properties in `src/app/globals.css` using oklch color space
- **Never use hardcoded Tailwind color classes** (`bg-white`, `bg-gray-50`, `text-gray-900`, `text-indigo-600`, `bg-red-50`, etc.)
- Always use semantic tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `text-primary`, `text-destructive`, `border-border`
- Error messages: `bg-destructive/10 text-destructive`
- Brand links: `text-primary hover:text-primary/80`

**Brand palette (oklch):**
- Background: `oklch(0.09 0.016 264)` — deep blue-black
- Card surface: `oklch(0.13 0.014 264)`
- Brand indigo: `oklch(0.61 0.22 264)`
- Muted text: `oklch(0.52 0.03 264)`
- Destructive (red): `oklch(0.60 0.22 27)`
- Border: `oklch(0.23 0.022 264)`

**Status badge colors (dark-optimized):**
- pending → `bg-amber-500/15 text-amber-300`
- paid → `bg-emerald-500/15 text-emerald-300`
- declined → `bg-red-500/15 text-red-300`
- expired/cancelled → `bg-slate-500/15 text-slate-400`

### V. Playwright E2E Coverage
All user-facing interactive features require Playwright E2E coverage. Tests use Page Object Models with `data-testid` selectors. `data-testid` attributes are added during implementation, not as an afterthought. Two seed users (ALICE, BOB) created in `tests/global-setup.ts` via Supabase Admin API. Each test is isolated — creates its own data via `tests/helpers/db.ts`.

### VI. TypeScript Strict Mode
TypeScript strict mode is enabled. No `any` without explicit justification comment. No non-null assertions (`!`) without justification. Zod schemas are the single source of truth for validation — shared between client forms and server actions.

## Technology Stack (Locked)

- **Frontend**: Next.js 14+ App Router, TypeScript 5.x, Tailwind CSS v4, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth), `@supabase/ssr` for session management
- **Testing**: Playwright E2E
- **Deployment**: Vercel

## Security Requirements

- Login rate limiting: 5 failures in 15-minute rolling window → 15-minute lockout
- Session inactivity timeout: 30 minutes (IdleTimer client component)
- Session absolute lifetime: 8 hours (Supabase refresh token expiry)
- RLS on all tables — no raw service role in client code
- Return URL validation: only accept paths starting with `/`

## Governance

This constitution supersedes all other practices. The design system (Principle IV) is locked — any future `/speckit-plan` invocation for PayRequest features MUST preserve the dark fintech palette and semantic token conventions.

**Version**: 1.0.0 | **Ratified**: 2026-04-10 | **Last Amended**: 2026-04-12
