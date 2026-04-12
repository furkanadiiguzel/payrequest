# Tasks: P2P Payment Request

**Input**: Design documents from `specs/001-p2p-payment-request/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Playwright E2E tests are explicitly required by the spec. Test tasks are included in each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and dev tooling. No business logic.

- [x] T001 Bootstrap Next.js project: scaffold `src/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.ts` (strict TypeScript, `experimental.typedRoutes: true`) — if `create-next-app` rejects non-empty directory, scaffold in `/tmp/payrequest-scaffold` then copy files to repo root
- [x] T002 Install runtime dependencies: `@supabase/ssr @supabase/supabase-js date-fns react-hook-form @hookform/resolvers zod`
- [x] T003 [P] Install dev dependencies: `playwright @playwright/test` and run `npx playwright install --with-deps chromium`
- [x] T004 [P] Initialize shadcn/ui (`npx shadcn-ui@latest init`, style=Default, base=Slate, CSS variables=yes) and install components: `card button input label badge dialog tabs sonner`
- [x] T005 [P] Create `.env.example` with all required keys (no secret values): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `LOGIN_MAX_FAILURES=5`, `LOGIN_LOCKOUT_MINUTES=15`; update `.gitignore` to exclude `.env.local`
- [x] T006 Create `playwright.config.ts` at repo root: `baseURL: 'http://localhost:3000'`, `video: 'on'`, `screenshot: 'only-on-failure'`, `globalSetup: './tests/global-setup.ts'`, `testDir: './tests/e2e'`

**Checkpoint**: `npm run dev` starts without errors (app shows default Next.js page)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure — DB schema, Supabase clients, middleware, shared utilities, and type definitions. ALL user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database Migrations

- [x] T007 Create `supabase/migrations/20260412_001_create_profiles.sql`: `profiles` table with PK, email UNIQUE NOT NULL, phone NULLABLE, display_name NULLABLE, created_at; enable RLS; `handle_new_user()` trigger (SECURITY DEFINER) that inserts profile row on `auth.users` INSERT
- [x] T008 Create `supabase/migrations/20260412_002_create_payment_requests.sql`: `payment_requests` table with all columns per data-model.md (id, sender_id FK, recipient_email, recipient_phone, recipient_id FK, amount_cents CHECK, note CHECK, status CHECK, created_at, expires_at DEFAULT +7 days, paid_at, declined_at, cancelled_at); enable RLS; create 4 indexes (sender, recipient_email, status, expires_at partial)
- [x] T009 [P] Create `supabase/migrations/20260412_003_create_audit_logs.sql`: `audit_logs` table (id, event_type NOT NULL, actor_id NULLABLE no FK, actor_email, target_id, previous_value, new_value, metadata jsonb, created_at); enable RLS; INSERT-only policy `WITH CHECK (true)`; NO UPDATE/DELETE policies
- [x] T010 [P] Create `supabase/migrations/20260412_004_create_login_attempts.sql`: `login_attempts` table (id, email NOT NULL, attempted_at DEFAULT now(), success boolean NOT NULL); index on `(email, attempted_at DESC)`; no RLS (service-role-only access)
- [x] T011 Create `supabase/migrations/20260412_005_rls_policies.sql`: RLS policies for `payment_requests` (SELECT: sender OR recipient_id OR recipient_email match; INSERT: sender_id = auth.uid(); UPDATE sender cancel; UPDATE recipient pay/decline) and `profiles` (SELECT own row only)

### Supabase Clients

- [x] T012 [P] Create `src/lib/supabase/client.ts`: browser client using `createBrowserClient` from `@supabase/ssr`
- [x] T013 [P] Create `src/lib/supabase/server.ts`: server client using `createServerClient` from `@supabase/ssr` with `next/headers` cookies
- [x] T014 [P] Create `src/lib/supabase/middleware.ts`: middleware client factory (createServerClient variant for middleware context)
- [x] T015 [P] Create `src/lib/supabase/service.ts`: service role client using `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`; add `'use server'` comment block clarifying this is server-only

### Middleware

- [x] T016 Create `src/middleware.ts`: call `supabase.auth.getUser()` on every matched request to refresh JWT; redirect unauthenticated users on `/dashboard` and `/request/new` to `/login?returnUrl=<encoded>`; redirect authenticated users on `/login` and `/signup` to `/dashboard`; matcher excludes static assets

### Shared Types & Utilities

- [x] T017 [P] Create `src/types/database.ts`: TypeScript interfaces — `PaymentRequestStatus` union, `PaymentRequest`, `Profile`, `AuditLog`, `LoginAttempt`
- [x] T018 [P] Create `src/lib/currency.ts`: `centsToDollars(cents: number): string` returning `"$XX.XX"` format
- [x] T019 [P] Create `src/lib/mask.ts`: `maskEmail(email: string): string` returning `"j***@gmail.com"` format (first char + `***` + `@` + domain)
- [x] T020 [P] Create `src/lib/phone.ts`: `normalizePhone(raw: string): string | null` — strip non-digits, strip leading `1` if 11 digits starting with `1`, return 10-digit string or null
- [x] T021 Create `src/lib/audit.ts`: `writeAuditLog(entry: AuditEntry): Promise<void>` using service role client; type `AuditEntry` covers all 5 event types
- [x] T022 [P] Create `src/lib/validations/auth.ts`: Zod schemas `loginSchema` (email + password) and `signupSchema` (email + password min 6 chars)
- [x] T023 [P] Create `src/lib/validations/request.ts`: Zod schema `createRequestSchema` (recipient string, amount string matching `/^\d+(\.\d{1,2})?$/`, optional note ≤280 chars)
- [x] T024 [P] Create `src/lib/requests.ts`: stub file with exported functions `fetchSentRequests`, `fetchReceivedRequests`, and `applyExpiryToRequest` (implement `applyExpiryToRequest` fully now — returns copy with `status:'expired'` if pending and `expires_at < new Date()`)

### Root Layout & Global UI

- [x] T025 Create `src/app/layout.tsx`: root layout with `<html>`, `<body>`, import and render `<Toaster />` from `sonner` (covers all routes including auth pages)
- [x] T026 [P] Create `src/app/not-found.tsx`: global 404 page with "Page not found" message and link back to `/dashboard`
- [x] T027 [P] Create `src/components/StatusBadge.tsx`: renders shadcn `Badge` variant per status — pending=amber-100/amber-800, paid=emerald-100/emerald-800, declined=red-100/red-800, expired=slate-100/slate-600, cancelled=slate-100/slate-600 with `line-through` on label text

**Checkpoint**: Foundation ready — migrations written, clients created, middleware in place, shared utilities available. Apply migrations to Supabase project via SQL Editor in order T007→T011 and verify `handle_new_user` trigger fires by creating a test user.

---

## Phase 3: User Story 1 — User Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can sign up, log in, and log out. Rate limiting blocks brute-force attempts. Session inactivity timeout enforced client-side.

**Independent Test**: Open the app unauthenticated → redirected to `/login`. Sign up with new email/password → redirected to `/dashboard`. Log out → redirected to `/login`. Attempt 5 failed logins → see lockout message.

### Implementation

- [x] T028 [P] [US1] Create `src/app/(auth)/layout.tsx`: centered single-column layout, indigo-600 brand header with "PayRequest" logo, no navigation bar
- [x] T029 [P] [US1] Create `src/app/(auth)/login/page.tsx`: server component that renders `<LoginForm />`, reads `searchParams` for `returnUrl`
- [x] T030 [US1] Create `src/app/(auth)/login/LoginForm.tsx`: client component — `useForm` with `loginSchema`; email field, password field; inline field errors; form-level error alert for server errors; submit calls `loginAction`; reads `returnUrl` from URL via `useSearchParams`
- [x] T031 [P] [US1] Create `src/app/(auth)/signup/page.tsx`: server component that renders `<SignupForm />`
- [x] T032 [US1] Create `src/app/(auth)/signup/SignupForm.tsx`: client component — `useForm` with `signupSchema`; email field, password field (min 6 chars hint); inline errors; submit calls `signupAction`; link to `/login`
- [x] T033 [US1] Create `src/app/page.tsx`: server component — `supabase.auth.getUser()` → `redirect('/dashboard')` if authenticated, `redirect('/login')` if not
- [x] T034 [US1] Implement `loginAction`, `signupAction`, `logoutAction` in `src/actions/auth.ts`: rate-limit check before login (query `login_attempts` rolling 15-min window via service role); insert `login_attempts` row after attempt; call `writeAuditLog` for all auth events; validate `returnUrl` starts with `/` before redirecting
- [x] T035 [US1] Create `src/app/(protected)/layout.tsx`: authenticated shell layout with top navigation — "PayRequest" logo, "New Request" button linking to `/request/new`, logged-in user email display, logout button that calls `logoutAction`; render `<IdleTimer />`
- [x] T036 [US1] Create `src/components/IdleTimer.tsx`: `'use client'` component — listens to `mousemove`, `keydown`, `click`, `scroll`; updates `lastActivity` in `sessionStorage`; `setInterval` every 60s checks if `now - lastActivity > 30 * 60 * 1000` → calls `logoutAction()` and `writeAuditLog({ event_type: 'session_expired' })`

### E2E Tests

- [x] T037 [P] [US1] Create `tests/helpers/seed.ts`: export `ALICE = { email: 'alice@payrequest.test', password: 'TestPass123!' }` and `BOB` constants
- [x] T038 [P] [US1] Create `tests/helpers/auth.ts`: `loginAs(page, email, password)` and `logoutCurrentUser(page)` helper functions
- [x] T039 [US1] Create `tests/global-setup.ts`: create ALICE and BOB via Supabase Auth Admin API using `SUPABASE_SERVICE_ROLE_KEY`; skip if users already exist; verify DB connection
- [x] T040 [P] [US1] Create `tests/pages/LoginPage.ts`: POM with `goto()`, `fillEmail()`, `fillPassword()`, `submit()`, `getError()` methods; all selectors use `data-testid`
- [x] T041 [P] [US1] Create `tests/pages/SignupPage.ts`: POM with same pattern as LoginPage
- [x] T042 [US1] Write `tests/e2e/auth.spec.ts`: signup valid → dashboard redirect; signup duplicate email → inline error; signup short password → inline error; login valid → dashboard; login invalid → "Invalid email or password"; logout → /login; unauthenticated /dashboard → /login?returnUrl; rate-limit test using throwaway email `locked_${Date.now()}@test.com` — 5 failures → lockout message

**Checkpoint**: Auth fully functional and all `auth.spec.ts` tests pass. Users can register and log in.

---

## Phase 4: User Story 2 — Create a Payment Request (Priority: P2)

**Goal**: A logged-in user can create a payment request to an email or phone recipient with an amount and optional note. Receives a shareable link on success.

**Independent Test**: Log in as ALICE → click "New Request" → fill form with valid email recipient, $25.00, optional note → submit → success screen shows shareable link → copy link → auto-redirected to `/dashboard` after 3 seconds.

### Implementation

- [x] T043 [US2] Create `src/app/(protected)/request/new/page.tsx`: server component that fetches current user email (for self-request validation) and renders `<RequestForm userEmail={...} />`
- [x] T044 [US2] Create `src/app/(protected)/request/new/RequestForm.tsx`: `'use client'` component — recipient input (auto-detects email vs phone using `normalizePhone`); amount input with regex validation `/^\d+(\.\d{1,2})?$/`; note textarea with live character counter (turns red at 280, disables submit); all inline error messages per spec; on successful `createRequest` action renders `<SuccessScreen />`; network error → `toast.error("Something went wrong. Please try again.")`
- [x] T045 [US2] Create `src/app/(protected)/request/new/SuccessScreen.tsx`: `'use client'` — displays "Request sent!", shareable link `${NEXT_PUBLIC_APP_URL}/request/${requestId}`, "Copy Link" button using `navigator.clipboard.writeText()` with inline "Copied!" feedback, "Send another" and "Go to dashboard" options; `useEffect` auto-redirects to `/dashboard` after 3 seconds (clears on unmount)
- [x] T046 [US2] Implement `createRequest(formData: FormData)` in `src/actions/requests.ts`: `supabase.auth.getUser()`; server-side Zod parse; `normalizePhone` if not valid email; `Math.round(parseFloat(amount) * 100)` → cents; self-request check (`recipient_email !== user.email`); insert via authenticated client; return `{ success: true, requestId }` or `{ success: false, error }`

### E2E Tests

- [x] T047 [P] [US2] Create `tests/pages/RequestFormPage.ts`: POM with `goto()`, `fillRecipient()`, `fillAmount()`, `fillNote()`, `submit()`, `getFieldError(field)`, `getSuccessScreen()`, `copyLink()` methods
- [x] T048 [US2] Write `tests/e2e/create-request.spec.ts`: valid email recipient → success screen; valid phone formats ("+1 (555) 123-4567", "555-123-4567", "5551234567") → success; invalid email → inline error; invalid phone → inline error; amount $0 → error; amount >$10,000 → error; amount 3 decimals → error; note >280 chars → counter red + submit disabled; self-request (own email) → error; copy link → clipboard contains correct URL; success screen 3s redirect to dashboard

**Checkpoint**: Payment requests can be created and appear in the DB. ALICE can create a request to BOB's email. Shareable link is generated.

---

## Phase 5: User Story 3 — View & Manage Request Dashboard (Priority: P3)

**Goal**: A logged-in user sees all their sent and received requests in a tabbed dashboard with status filtering and free-text search.

**Independent Test**: Log in as ALICE (who has sent a request to BOB) → Sent tab shows the request card with correct amount, status badge, and relative timestamp → filter by "Pending" → card still shows → search by BOB's email → card shows → clear filters → switch to Received tab (log in as BOB) → request from ALICE appears.

### Implementation

- [x] T049 [US3] Implement `fetchSentRequests(userId: string)` and `fetchReceivedRequests(userEmail: string)` in `src/lib/requests.ts`: each query uses server Supabase client, selects all columns, `ORDER BY created_at DESC LIMIT 50`, applies `applyExpiryToRequest` to every row before returning
- [x] T050 [US3] Create `src/app/(protected)/dashboard/page.tsx`: server component — `supabase.auth.getUser()`; `Promise.all([fetchSentRequests(user.id), fetchReceivedRequests(userEmail)])`; render `<DashboardTabs sentRequests={...} receivedRequests={...} />`
- [x] T051 [US3] Create `src/app/(protected)/dashboard/DashboardTabs.tsx`: `'use client'` — shadcn `Tabs` with "Sent" (default) and "Received"; status filter dropdown (All/Pending/Paid/Declined/Expired/Cancelled); search input; client-side filtering: `requests.filter(status).filter(search)`; renders `<RequestCard />` per result or empty state; "No requests yet" with CTA or "No requests match your filters" with "Clear filters" link; `data-testid` on all interactive elements
- [x] T052 [US3] Create `src/app/(protected)/dashboard/RequestCard.tsx`: `'use client'` — shadcn `Card` with counterparty identifier, `centsToDollars(amount_cents)`, note truncated to 50 chars + "...", `<StatusBadge status={...} />`, `formatDistanceToNow(new Date(created_at), { addSuffix: true })` from `date-fns`; `onClick` navigates to `/request/${id}`; `data-testid="request-card"`
- [x] T053 [P] [US3] Create `src/app/(protected)/dashboard/loading.tsx`: skeleton loading state using Tailwind `animate-pulse` — 3 skeleton cards mimicking `RequestCard` layout

### E2E Tests

- [x] T054 [P] [US3] Create `tests/helpers/db.ts`: `createTestRequest(params: Partial<PaymentRequest>)` inserts directly via service role Supabase client — fast test setup without UI navigation
- [x] T055 [P] [US3] Create `tests/pages/DashboardPage.ts`: POM with `waitForLoad()`, `clickSentTab()`, `clickReceivedTab()`, `setStatusFilter(status)`, `setSearch(query)`, `clearFilters()`, `getRequestCards()`, `clickRequestCard(index)` methods
- [x] T056 [US3] Write `tests/e2e/dashboard.spec.ts`: Sent tab default + newest-first sort; Received tab shows requests sent to user's email; status filter "Pending" shows only pending; search filters by counterparty (case-insensitive); filter + search AND logic; empty state (no requests); no-results state with "Clear filters"; card click navigates to detail

**Checkpoint**: Dashboard fully functional. ALICE can see sent requests. BOB can see received requests. Filters and search work.

---

## Phase 6: User Story 4 — View Request Detail & Take Actions (Priority: P4)

**Goal**: Sender and recipient can view full request details. Recipient can pay or decline; sender can cancel. Non-pending requests show terminal state only.

**Independent Test**: ALICE creates a request to BOB → BOB navigates to `/request/{id}` → sees Pay and Decline buttons → BOB clicks Pay → loading spinner shows → success overlay appears → redirected to dashboard → request shows "Paid" badge. Separately: ALICE clicks Cancel → confirmation dialog → cancelled.

### Implementation

- [x] T057 [US4] Create `src/app/request/[id]/page.tsx`: server component implementing the **authenticated** viewer states — call `supabase.auth.getUser()`; if user is null render a placeholder `<UnauthenticatedRequestView />` stub (will be completed in T069); if user exists: fetch request via authenticated client (RLS applied); if result is null → `notFound()`; determine role: `sender_id === user.id` → `viewerRole='sender'`, `recipient_id === user.id || recipient_email === user.email` → `viewerRole='recipient'`, otherwise → `notFound()`; apply `applyExpiryToRequest`; pass resolved request and `viewerRole` to `<RequestDetailClient />`
- [x] T058 [US4] Create `src/app/request/[id]/RequestDetailClient.tsx`: `'use client'` — displays amount (large, prominent), full note, sender email, recipient identifier, `<StatusBadge />`, formatted `created_at`, expiry countdown for pending (`formatDistanceToNow(expires_at)` updated every 60s); conditional action buttons: recipient+pending → Pay + Decline; sender+pending → Cancel + Copy Link; non-pending → terminal timestamp; Pay button uses `useTransition` for disable-on-click; Decline and Cancel use shadcn `Dialog` for confirmation; `data-testid` on all buttons and dialogs; on action success → `router.push('/dashboard')`; on pay success → render `<PaymentSuccessOverlay />`
- [x] T059 [US4] Create `src/app/request/[id]/PaymentSuccessOverlay.tsx`: `'use client'` — fixed full-screen div (z-50, bg-white/95); "Payment of $XX.XX sent to [sender email]!" message; checkmark icon; "Back to Dashboard" button; `useEffect` auto-redirects to `/dashboard` after 3 seconds; `data-testid="payment-success-overlay"`
- [x] T060 [P] [US4] Create `src/app/request/[id]/not-found.tsx`: route-specific 404 — "Request not found" message with link to `/dashboard`
- [x] T061 [P] [US4] Create `src/app/request/[id]/loading.tsx`: skeleton for detail page
- [x] T062 [US4] Implement `payRequest`, `declineRequest`, `cancelRequest` in `src/actions/requests.ts`: each action: (1) `supabase.auth.getUser()`; (2) fetch via service role; (3) **expiry check first** — if `applyExpiryToRequest(r).status === 'expired'`: update DB to `expired` via service role, `writeAuditLog` transition, return `{ error: "This request has expired" }`; (4) check `status === 'pending'`; (5) verify caller role; (6) `payRequest` only: `await new Promise(r => setTimeout(r, 2000 + Math.random() * 1000))`; (7) update status + terminal timestamp via service role — `payRequest` sets `paid_at=now()`, `declineRequest` sets `declined_at=now()`, `cancelRequest` sets `cancelled_at=now()`; (8) `await writeAuditLog({ event_type: 'status_transition', previous_value: 'pending', new_value: ... })`; return `{ success: true }`

### E2E Tests

- [x] T063 [P] [US4] Create `tests/pages/RequestDetailPage.ts`: POM with `waitForLoad()`, `getAmount()`, `getStatus()`, `clickPay()`, `clickDecline()`, `clickCancel()`, `confirmDialog()`, `cancelDialog()`, `waitForSuccessOverlay()`, `clickCopyLink()` methods
- [x] T064 [US4] Write `tests/e2e/request-detail.spec.ts`: sender view (Cancel + Copy Link buttons); recipient view (Pay + Decline buttons); Pay flow (spinner → overlay → redirect → DB status=paid); Decline flow (dialog → decline → redirect); Cancel flow (dialog → cancel → redirect); dialog cancel → no action; terminal state (no buttons, timestamp shown); unrelated user → 404; double-click protection (second click ignored)

**Checkpoint**: Full payment lifecycle functional. ALICE can cancel; BOB can pay or decline. Audit logs written for all transitions.

---

## Phase 7: User Story 5 — Request Expiration (Priority: P5)

**Goal**: Requests older than 7 days automatically show as "Expired" everywhere. No action buttons shown. Attempting to act on an expired request shows an error.

**Independent Test**: Use `db.ts` helper to insert a request with `expires_at` set 1 second in the past → navigate to dashboard → card shows gray "Expired" badge → navigate to detail → "This request expired on [date]" shown, no Pay/Decline buttons → attempt `payRequest` on expired ID → receive "This request has expired" error.

### Implementation

- [x] T065 [US5] Verify `applyExpiryToRequest` in `src/lib/requests.ts` correctly handles edge cases: exactly at expiry time, milliseconds before expiry, null `expires_at` (should not happen but handle gracefully)
- [x] T066 [US5] Verify `payRequest`, `declineRequest`, `cancelRequest` in `src/actions/requests.ts` all perform expiry check BEFORE status check and correctly write `expired` to DB with audit log when expired request is encountered
- [x] T067 [US5] Update `src/app/request/[id]/RequestDetailClient.tsx` to display "This request expired on [formatted date]" text (using `format(new Date(expires_at), 'MMMM d, yyyy')` from `date-fns`) for authenticated viewers of expired requests; ensure no action buttons are rendered when status is `expired` (the unauthenticated expired banner is handled separately in T069 within `page.tsx`)

### E2E Tests

- [x] T068 [US5] Write `tests/e2e/expiry.spec.ts`: expired request on dashboard shows gray "Expired" badge; expired request detail shows banner + no action buttons; pay attempt on already-expired request (via direct action call) returns "This request has expired" error; expired request via shareable link shows "This request has expired" banner

**Checkpoint**: Expiry works correctly end-to-end. No stale pending requests shown anywhere.

---

## Phase 8: User Story 6 — Shareable Link & Unauthenticated Access (Priority: P6)

**Goal**: Anyone with a request link can see basic details without logging in. Sender email is masked. "Log in to respond" redirects to login with return URL.

**Independent Test**: Open `/request/{id}` in incognito/logged-out browser → see amount, note, masked sender email (e.g., "a***@test.com"), "Log in to respond" button, "Sign up" option → click "Log in to respond" → redirected to `/login?returnUrl=/request/{id}` → after login as BOB (recipient) → redirected back to request with full details and Pay/Decline buttons visible.

### Implementation

- [x] T069 [US6] Complete the unauthenticated branch in `src/app/request/[id]/page.tsx`: replace the `<UnauthenticatedRequestView />` stub from T057 with full implementation — when `user` is null: use service role client to fetch request by ID (`notFound()` if absent); fetch sender profile for email; apply `maskEmail()` to sender email; render public view showing amount, full note, masked sender email, status badge; if `applyExpiryToRequest(request).status === 'expired'` add "This request has expired" banner; render "Log in to respond" button linking to `/login?returnUrl=/request/${id}` and "Sign up" link to `/signup?returnUrl=/request/${id}`; do NOT expose `sender_id`, `recipient_id`, full sender email, or recipient identifier in the rendered output

### E2E Tests

- [x] T070 [US6] Write `tests/e2e/unauthenticated-access.spec.ts`: unauthenticated user sees masked sender email, amount, full note, "Log in to respond" button, and "Sign up" option; "Log in to respond" redirects to `/login?returnUrl=/request/{id}`; after login as BOB (recipient), redirected back to request with full details and action buttons; after login as unrelated user, redirected back to request → 404 shown

**Checkpoint**: Shareable links work publicly. Recipients can discover requests via links sent to their phone/email and log in to respond.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error boundaries, production hardening, and final validation.

- [x] T071 [P] Create `src/app/(protected)/dashboard/error.tsx`: error boundary for dashboard — "Failed to load requests" message with retry button that calls `router.refresh()`
- [x] T072 [P] Create `src/app/request/[id]/error.tsx`: error boundary for request detail — "Failed to load request" with "Go to dashboard" link
- [x] T073 [P] Create `src/app/error.tsx`: global error boundary as fallback
- [x] T074 Verify `SUPABASE_SERVICE_ROLE_KEY` is never in client bundle: check that `src/lib/supabase/service.ts` is only imported in `src/actions/` and `src/lib/` server files; add comment block `// SERVER ONLY — never import in client components` at top of file
- [x] T075 Run `npm run build` and fix any TypeScript errors or build failures; ensure `experimental.typedRoutes` produces no unknown route errors
- [x] T076 Run full Playwright suite `npx playwright test --reporter=list` — all 6 spec files must pass; review any video recordings for failing tests
- [x] T077 [P] Follow `specs/001-p2p-payment-request/quickstart.md` end-to-end on a clean `.env.local` setup: scaffold → install → migrations → dev server → create a request → pay it → check `audit_logs` in Supabase SQL Editor

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 completion — **BLOCKS all user stories**
- **Phase 3–8 (User Stories)**: All require Phase 2 completion; can proceed in priority order or in parallel
- **Phase 9 (Polish)**: Requires all desired user story phases complete

### User Story Dependencies

| Story | Depends On | Notes |
|-------|------------|-------|
| US1 Auth (P1) | Phase 2 | Independent of all other stories |
| US2 Create Request (P2) | Phase 2 + US1 | Requires auth to access `/request/new` |
| US3 Dashboard (P3) | Phase 2 + US1 + US2 | Dashboard needs requests to display |
| US4 Request Detail (P4) | Phase 2 + US1 + US2 | Detail page needs a request to show |
| US5 Expiration (P5) | Phase 2 + US3 + US4 | Verifies expiry logic in dashboard + detail |
| US6 Shareable Link (P6) | Phase 2 + US4 | Public view is part of the detail page |

### Within Each User Story

- E2E infrastructure (POMs, helpers) can be created in [P] parallel with implementation
- Implementation tasks within a story follow: server action → server component → client component
- Test spec files must be written after the feature is implemented (E2E, not TDD)
- Commit after each completed story phase checkpoint

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005 can all run in parallel after T001
- Phase 2: DB migrations T007–T010 can run in parallel; Supabase clients T012–T015 can run in parallel; utilities T017–T023 can all run in parallel
- Phase 3: POM/helper files T037–T041 can run in parallel with implementation T028–T036
- Phases 4–8: Once Phase 3 is complete, US2–US6 can be worked in parallel by different developers

---

## Parallel Example: Phase 2 (Foundational)

```
# Migrations (run in order due to FK dependencies):
T007 → T008 → T009, T010 (parallel) → T011

# Supabase clients (all parallel):
T012, T013, T014, T015 (parallel)

# Utilities (all parallel after clients):
T017, T018, T019, T020, T021, T022, T023, T024 (parallel)
```

## Parallel Example: Phase 3 (US1 Authentication)

```
# E2E infrastructure (parallel with implementation):
T037, T038, T040, T041 (parallel) → T039 (depends on seed constants)

# Implementation:
T028, T029, T031 (parallel layouts) → T030, T032, T033, T034 (sequential, depends on clients)
→ T035, T036 (protected layout + idle timer)
→ T042 (tests, after implementation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — apply migrations, verify trigger
3. Complete Phase 3: US1 Authentication
4. **STOP and VALIDATE**: Sign up, log in, log out, verify rate limiting, run `auth.spec.ts`
5. Demo: Working auth-gated app

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Auth) → Test independently → Running app with auth
3. Add US2 (Create Request) → Test independently → Users can create requests
4. Add US3 (Dashboard) → Test independently → Full request management UI
5. Add US4 (Detail + Actions) → Test independently → Complete payment lifecycle
6. Add US5 (Expiration) → Verify expiry correct
7. Add US6 (Shareable Links) → Full product ready
8. Polish + full test suite pass → Production-ready

---

## Notes

- [P] tasks operate on different files with no shared dependencies — safe to parallelize
- `data-testid` attributes MUST be added during implementation (not as an afterthought) — Playwright selectors depend on them
- Amounts are ALWAYS integer cents in server code and DB; convert to `$XX.XX` only at display time
- The service role client (`src/lib/supabase/service.ts`) is NEVER imported in client components
- `applyExpiryToRequest` is a pure function — it does NOT write to the DB; expiry DB writes happen only in server actions when a transition is attempted
- Apply Supabase migrations via the SQL Editor in order; verify the `handle_new_user` trigger fires before proceeding past Phase 2
- Stop at each phase checkpoint to validate the story independently before moving on
