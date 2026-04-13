# Implementation Plan: P2P Payment Request

**Branch**: `001-p2p-payment-request` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-p2p-payment-request/spec.md`

## Summary

Build a full-stack P2P payment request web application (PayRequest) on Next.js 14+ App Router. Users create shareable payment requests with a 7-day expiry, track them on a tabbed dashboard, and recipients can pay, decline, or let them expire. Light fintech compliance is in scope: an immutable audit trail for all status transitions and auth events, session inactivity timeout, and login rate limiting. No real payment processing — payment is simulated with a 2–3 second delay.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+ via Next.js runtime)
**Primary Dependencies**: Next.js 14+ App Router, Tailwind CSS, shadcn/ui, @supabase/ssr, @supabase/supabase-js, date-fns, react-hook-form, @hookform/resolvers, zod, Playwright
**Storage**: PostgreSQL via Supabase (tables: profiles, payment_requests, audit_logs, login_attempts)
**Testing**: Playwright E2E with Page Object Model; video ON for all tests, screenshots on failure
**Target Platform**: Vercel (serverless), Supabase hosted PostgreSQL
**Project Type**: web-service (full-stack Next.js with server components and server actions)
**Performance Goals**: Dashboard and request detail pages load within 2 seconds; full create-request flow completable in under 60 seconds
**Constraints**: Session inactivity timeout 30 minutes, absolute lifetime 8 hours; login lockout after 5 consecutive failures (15-minute rolling window); amounts stored as integer cents; no real payment processing
**Scale/Scope**: MVP — up to 50 requests per dashboard tab loaded client-side, no pagination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Status**: The project constitution (`/Users/furkanadiguzel/Desktop/payrequest/.specify/memory/constitution.md`) contains only the placeholder template — no project-specific principles have been ratified. No gates to evaluate. Technical decisions default entirely to spec requirements and clarification session outcomes.

**Post-design re-check**: No constitution violations introduced by the Phase 1 design. The data model, contracts, and project structure are consistent with the technical direction established during `/plan`.

## Project Structure

### Documentation (this feature)

```text
specs/001-p2p-payment-request/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── server-actions.md
│   ├── rls-policies.md
│   └── route-contracts.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/                    # Auth route group (no navbar)
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── LoginForm.tsx
│   │   └── signup/
│   │       ├── page.tsx
│   │       └── SignupForm.tsx
│   ├── (protected)/               # Authenticated route group (with navbar)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── DashboardTabs.tsx
│   │   │   ├── RequestCard.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── request/
│   │       └── new/
│   │           ├── page.tsx
│   │           ├── RequestForm.tsx
│   │           └── SuccessScreen.tsx
│   ├── request/
│   │   └── [id]/                  # Public (works auth + unauth)
│   │       ├── page.tsx
│   │       ├── RequestDetailClient.tsx
│   │       ├── PaymentSuccessOverlay.tsx
│   │       ├── not-found.tsx
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── layout.tsx                 # Root layout (Sonner Toaster here)
│   ├── page.tsx                   # Root redirect
│   ├── error.tsx
│   └── not-found.tsx
├── actions/
│   ├── auth.ts                    # loginAction, signupAction, logoutAction
│   └── requests.ts                # createRequest, payRequest, declineRequest, cancelRequest
├── components/
│   ├── ui/                        # shadcn/ui generated components
│   ├── StatusBadge.tsx
│   └── IdleTimer.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server component client
│   │   ├── middleware.ts          # Middleware client factory
│   │   └── service.ts             # Service role client (server-only)
│   ├── audit.ts                   # writeAuditLog() — service role writes
│   ├── currency.ts                # centsToDollars()
│   ├── mask.ts                    # maskEmail()
│   ├── phone.ts                   # normalizePhone()
│   ├── requests.ts                # fetchSentRequests, fetchReceivedRequests, applyExpiryToRequest
│   └── validations/
│       ├── auth.ts                # Zod schemas for login/signup
│       └── request.ts             # Zod schema for payment request creation
├── types/
│   └── database.ts                # TypeScript interfaces for DB entities
└── middleware.ts                  # Route protection + session refresh

supabase/
└── migrations/
    ├── 20260410_001_create_profiles.sql
    ├── 20260410_002_create_payment_requests.sql
    ├── 20260410_003_create_audit_logs.sql
    ├── 20260410_004_create_login_attempts.sql
    └── 20260410_005_rls_policies.sql

tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── create-request.spec.ts
│   ├── dashboard.spec.ts
│   ├── request-detail.spec.ts
│   ├── unauthenticated-access.spec.ts
│   └── expiry.spec.ts
├── pages/
│   ├── LoginPage.ts
│   ├── SignupPage.ts
│   ├── DashboardPage.ts
│   ├── RequestFormPage.ts
│   └── RequestDetailPage.ts
├── helpers/
│   ├── auth.ts
│   ├── db.ts
│   └── seed.ts
└── global-setup.ts
```

**Structure Decision**: Single full-stack web application (Next.js App Router). Route groups `(auth)` and `(protected)` provide layout isolation without URL segments. The `/request/[id]` route sits outside both groups because it must serve both authenticated and unauthenticated viewers.

## Design Direction

### Color System — Always-Dark Fintech Theme

PayRequest uses a **permanent dark UI** (no light mode). The color system is defined via CSS custom properties using the oklch color space in `src/app/globals.css`. The `dark` class is set on `<html>` unconditionally.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.09 0.016 264)` | Page background (deep blue-black) |
| `--foreground` | `oklch(0.93 0.008 264)` | Primary text (near-white with blue tint) |
| `--card` | `oklch(0.13 0.014 264)` | Card/surface background |
| `--primary` | `oklch(0.61 0.22 264)` | Brand color (indigo-500 equivalent) |
| `--primary-foreground` | `oklch(0.99 0 0)` | Text on primary |
| `--secondary` | `oklch(0.18 0.018 264)` | Secondary surface |
| `--muted` | `oklch(0.18 0.018 264)` | Muted background |
| `--muted-foreground` | `oklch(0.52 0.03 264)` | Secondary/muted text |
| `--accent` | `oklch(0.21 0.02 264)` | Hover accent surface |
| `--destructive` | `oklch(0.60 0.22 27)` | Errors and destructive actions (red) |
| `--border` | `oklch(0.23 0.022 264)` | Borders |
| `--input` | `oklch(0.16 0.016 264)` | Input background |
| `--ring` | `oklch(0.61 0.22 264)` | Focus ring |

### Status Badge Colors (dark-optimized)

| Status | Background | Text |
|--------|-----------|------|
| pending | `bg-amber-500/15` | `text-amber-300` |
| paid | `bg-emerald-500/15` | `text-emerald-300` |
| declined | `bg-red-500/15` | `text-red-300` |
| expired | `bg-slate-500/15` | `text-slate-400` |
| cancelled | `bg-slate-500/15` strikethrough | `text-slate-400` |

### Component Conventions

- **Never use hardcoded Tailwind color classes** like `bg-white`, `bg-gray-50`, `text-gray-900` — always use semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`)
- **Error messages**: `bg-destructive/10 text-destructive` (not `bg-red-50 text-red-700`)
- **Links**: `text-primary hover:text-primary/80` (not `text-indigo-600 hover:text-indigo-500`)
- **Borders**: `border-border` (not `border-gray-200`)
- Overlays: `bg-background/95 backdrop-blur-sm` (not `bg-white/95`)

## Complexity Tracking

> No constitution violations to justify — constitution placeholder is unfilled.
