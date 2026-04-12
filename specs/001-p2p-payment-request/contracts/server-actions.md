# Contract: Server Actions

**Feature**: 001-p2p-payment-request | **Date**: 2026-04-10

Server Actions are the server–client boundary for all mutations. They live in `src/actions/`. Every action re-validates the caller's identity server-side via `supabase.auth.getUser()` — no client-passed user IDs are trusted.

---

## Auth Actions (`src/actions/auth.ts`)

### `loginAction(formData: FormData)`

**Purpose**: Authenticate a user with email and password.

**Input** (from FormData):
- `email: string` — must be valid email format
- `password: string` — non-empty
- `returnUrl?: string` — optional, must start with `/` (validated before redirect)

**Rate limit check** (runs before auth attempt):
```
Query login_attempts WHERE email = ? AND attempted_at > NOW() - INTERVAL '15 min' AND success = false
If COUNT >= LOGIN_MAX_FAILURES → return { error: "Account temporarily locked. Try again after 15 minutes." }
```

**Success**: Inserts `login_attempts (success=true)`, writes `audit_logs (event_type='login_success')`, redirects to `returnUrl` or `/dashboard`.

**Failure**: Inserts `login_attempts (success=false)`, writes `audit_logs (event_type='login_failure')`, returns:
```typescript
{ error: "Invalid email or password" }
```

**Rate-limited**: Returns:
```typescript
{ error: "Account temporarily locked. Try again after 15 minutes." }
```

---

### `signupAction(formData: FormData)`

**Purpose**: Register a new user.

**Input** (from FormData):
- `email: string` — must be valid email format
- `password: string` — minimum 6 characters

**Success**: Writes `audit_logs (event_type='login_success')`, redirects to `/dashboard`.

**Failure**:
```typescript
{ error: string }  // e.g., "User already registered"
```

---

### `logoutAction()`

**Purpose**: Sign out the current user.

**Input**: None (caller identity from server-side session).

**Success**: Writes `audit_logs (event_type='logout')`, redirects to `/login`.

---

## Request Actions (`src/actions/requests.ts`)

### `createRequest(formData: FormData)`

**Purpose**: Create a new pending payment request.

**Auth**: Requires authenticated session; returns error if unauthenticated.

**Input** (from FormData):
- `recipient: string` — email or phone (auto-detected)
- `amount: string` — dollar format, e.g., `"25.99"`
- `note?: string` — optional, max 280 chars

**Server-side validation** (mirrors client Zod schema):
1. Parse `recipient`: attempt email validation → attempt phone normalization → error if both fail
2. Parse `amount`: regex check for ≤2 decimals, range check 1–1,000,000 cents
3. Parse `note`: trim, length ≤ 280
4. Check `recipient_email !== sender.email` (self-request guard)

**Success**:
```typescript
{ success: true, requestId: string }  // requestId = new UUID
```

**Failure**:
```typescript
{ success: false, error: string }
```

**DB write**: Authenticated Supabase client (RLS enforces `sender_id = auth.uid()`).

---

### `payRequest(requestId: string)`

**Purpose**: Simulate payment of a pending request. Recipient only.

**Auth**: Requires authenticated session.

**Validation sequence** (in order):
1. Fetch request via **service role client**
2. Check expiry: if `applyExpiryToRequest(request).status === 'expired'` → lazily update DB to `expired`, write audit log, return error
3. Check `status === 'pending'`; if not → return error
4. Verify caller is recipient (`recipient_id = user.id` OR `recipient_email = user.email`)
5. Simulate delay: `await sleep(2000 + Math.random() * 1000)`
6. Update: `status='paid'`, `paid_at=now()`
7. Write audit log: `event_type='status_transition'`, `previous_value='pending'`, `new_value='paid'`

**Success**:
```typescript
{ success: true, amountCents: number, senderEmail: string }
```

**Failure**:
```typescript
{ success: false, error: "This request has expired" | "Unauthorized" | "Request is not pending" }
```

---

### `declineRequest(requestId: string)`

**Purpose**: Decline a pending request. Recipient only.

**Validation sequence**: Same as `payRequest` steps 1–4 (no delay).
5. Update: `status='declined'`, `declined_at=now()`
6. Write audit log: `previous_value='pending'`, `new_value='declined'`

**Success**: `{ success: true }`
**Failure**: `{ success: false, error: string }`

After success: client redirects to `/dashboard`.

---

### `cancelRequest(requestId: string)`

**Purpose**: Cancel a pending request. Sender only.

**Validation sequence**:
1. Fetch request via service role client
2. Check expiry (same as above)
3. Check `status === 'pending'`
4. Verify `sender_id = user.id` (only sender can cancel)
5. Update: `status='cancelled'`
6. Write audit log: `previous_value='pending'`, `new_value='cancelled'`

**Success**: `{ success: true }`
**Failure**: `{ success: false, error: string }`

After success: client redirects to `/dashboard`.

---

## Audit Log Writes

All audit writes use `writeAuditLog()` from `src/lib/audit.ts`, which uses the **service role client** to guarantee the write succeeds regardless of the caller's auth state.

```typescript
interface AuditEntry {
  event_type: 'status_transition' | 'login_success' | 'login_failure' | 'logout' | 'session_expired';
  actor_id?: string;
  actor_email?: string;
  target_id?: string;       // payment_request.id for status_transition
  previous_value?: string;  // previous status
  new_value?: string;       // new status
  metadata?: Record<string, unknown>;
}
```

`writeAuditLog` is a fire-and-forget for non-critical events (login_failure, session_expired) but awaited for status transitions to ensure the audit record is written before returning to the caller.
