# Research: P2P Payment Request

**Feature**: 001-p2p-payment-request | **Date**: 2026-04-10

All decisions below were resolved during the `/speckit.clarify` session (2026-04-10) and the `/plan` technical direction session. No open NEEDS CLARIFICATION markers remain.

---

## Decision 1: Authentication Pattern

**Decision**: Supabase Auth with `@supabase/ssr` for session management; email/password only.

**Rationale**: `@supabase/ssr` is the officially supported Supabase package for Next.js App Router. It handles token refresh transparently via HTTP-only cookies on every middleware request, eliminating manual session hydration. Email/password is the only required auth method per the spec (FR-001); OAuth is explicitly out of scope for MVP.

**Alternatives considered**:
- NextAuth.js — adds complexity without benefit; Supabase Auth already provides the necessary primitives
- JWT in localStorage — rejected for security (XSS exposure); cookie-based is the right choice for a fintech context

---

## Decision 2: Session Timeout Strategy

**Decision**: Hybrid — server enforces absolute lifetime via Supabase refresh token expiry (8 hours); client enforces inactivity timeout (30 minutes) via an `IdleTimer` component.

**Rationale**: Supabase has no built-in inactivity timeout — it only supports absolute lifetime via JWT/refresh token expiry settings. A client-side idle timer (listening to `mousemove`, `keydown`, `click`, `scroll` events, checking every 60s) bridges this gap cleanly without requiring a separate backend endpoint.

**Supabase Dashboard config**:
- Auth > Sessions: JWT expiry = 3600s (1 hour)
- Refresh token expiry = 28800s (8 hours)

**IdleTimer behaviour**:
- Resets `lastActivity` in `sessionStorage` on any interaction
- Every 60s: if `now - lastActivity > 30 * 60 * 1000` → call `logoutAction()`, write `session_expired` audit log entry

**Alternatives considered**:
- Server-side session store with sliding expiry — requires additional infrastructure (Redis/DB polling) not justified for MVP
- Supabase Edge Functions with cron — over-engineered for this requirement

---

## Decision 3: Login Rate Limiting

**Decision**: Application-layer rate limiting using a `login_attempts` table. Query the rolling 15-minute failure window before each login attempt; block if count ≥ 5.

**Rationale**: No external rate-limiting middleware (e.g., Upstash Redis, Cloudflare) is available by default on Vercel free tier. The `login_attempts` table approach is self-contained, auditable (doubles as part of the audit trail), and satisfies SC-012 without additional services. The rolling window resets naturally — no cleanup job needed.

**Rate limit parameters** (from env vars, defaulting to):
- `LOGIN_MAX_FAILURES=5`
- `LOGIN_LOCKOUT_MINUTES=15`

**Alternatives considered**:
- Supabase built-in rate limiting — Supabase Auth has basic protection but does not expose the lockout threshold or duration for configuration
- next-rate-limit / Upstash Redis — adds external dependency not warranted for MVP
- In-memory counter — does not survive serverless cold starts on Vercel

---

## Decision 4: Expiry Implementation Strategy

**Decision**: Read-time expiry check via `applyExpiryToRequest()` (in-memory transform on every fetch); lazy DB write on attempted status transition.

**Rationale**: Writing `status='expired'` on every read creates write-amplification from a query path and risks race conditions. The in-memory transform guarantees SC-002 (zero stale pending display) without DB side effects. The DB is updated lazily only when a user attempts to act on an already-expired request — this is the natural moment and generates the correct audit log entry.

**Implementation**:
```typescript
export function applyExpiryToRequest(r: PaymentRequest): PaymentRequest {
  if (r.status === 'pending' && new Date(r.expires_at) < new Date()) {
    return { ...r, status: 'expired' };
  }
  return r;
}
```

**Alternatives considered**:
- Supabase Edge Function cron job to batch-expire — acceptable as a future optimisation but not required for MVP correctness
- DB trigger on SELECT — not supported by PostgreSQL (triggers fire on DML only)

---

## Decision 5: Audit Log Immutability

**Decision**: `audit_logs` table with RLS that grants INSERT but no UPDATE or DELETE to any role. Writes are performed exclusively via the service role client in server actions.

**Rationale**: Using the service role client for audit writes bypasses user-facing RLS and guarantees the write succeeds even mid-transaction. The service role key is stored server-side only (`SUPABASE_SERVICE_ROLE_KEY`, never `NEXT_PUBLIC_`). No FK constraint on `actor_id` so log rows survive user deletion.

**Alternatives considered**:
- Application-level append-only — trust without DB enforcement; weaker guarantee
- PostgreSQL audit extension (pgaudit) — available on Supabase Pro but not on free tier; overkill for MVP

---

## Decision 6: Unauthenticated Request View

**Decision**: Service role client fetches the request for unauthenticated viewers (bypasses RLS); only safe fields are passed to the client component; sender email is masked using `maskEmail()`.

**Rationale**: The RLS SELECT policy requires `auth.uid()`. Unauthenticated requests have no UID, so an authenticated client returns nothing. The server component must use the service role to fetch, then apply masking before rendering. The `recipient_id`, `sender_id`, and full `recipient_email`/`recipient_phone` are never sent to the unauthenticated client.

**Masking format**: `j***@gmail.com` (first char of local part + `***` + `@` + full domain).

---

## Decision 7: Phone Recipient Lookup (Received Tab)

**Decision** (clarified in session): Phone-addressed requests do NOT appear in the Received tab. They are accessible only via the shareable link. The Received tab matches exclusively on `recipient_email = user's registered email`.

**Rationale**: Phone-to-account linking requires phone verification infrastructure (SMS OTP) which is explicitly out of scope for MVP. The shareable link is the intended discovery mechanism for phone-based requests.

---

## Decision 8: Note Visibility for Unauthenticated Viewers

**Decision** (clarified in session): The full note is visible to anyone with the shareable link. Senders are responsible for note content.

**Rationale**: The note exists to give the recipient context for why they're being asked to pay. Hiding it defeats the purpose of the shareable link.

---

## Decision 9: Amount Precision Handling

**Decision**: `Math.round(parseFloat(amount) * 100)` for dollar-to-cents conversion. Client-side validation uses regex `/^\d+(\.\d{1,2})?$/` to reject >2 decimal places before the conversion.

**Rationale**: `Math.round` is required because `parseFloat("25.99") * 100 = 2598.9999...` in some floating-point environments. The regex catches >2 decimal places at the form level without relying on rounding behavior, satisfying FR-009.

---

## Decision 10: Double-Click Protection on Pay

**Decision**: React `useTransition` hook disables the Pay button while the server action is pending. Server action also re-validates `status === 'pending'` before writing.

**Rationale**: `useTransition` is the idiomatic Next.js App Router pattern for tracking server action pending state. The server-side re-validation is the true guard — client-side disable is UX polish. Together they satisfy SC-006 (idempotent payment simulation).

---

## Unresolved Items

None. All ambiguities were resolved during the `/speckit.clarify` session or addressed in the `/plan` technical direction.
