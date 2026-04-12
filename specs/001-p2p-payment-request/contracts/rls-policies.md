# Contract: Row-Level Security Policies

**Feature**: 001-p2p-payment-request | **Date**: 2026-04-10

RLS policies define who can read and write each table. These are the authoritative data-access contracts for the application. All application code must assume these policies are active — use the service role client only when intentional bypass is required (audit writes, unauthenticated request views, expiry lazy-updates).

---

## Table: `profiles`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `profiles_select_own` | `id = auth.uid()` |
| INSERT | _(via trigger only)_ | Trigger runs as SECURITY DEFINER — no user INSERT policy needed |
| UPDATE | _(none)_ | Profiles are not updated via application in MVP |
| DELETE | _(none)_ | |

**Notes**: Application code uses `auth.getUser()` to get the user's email; profiles are rarely queried directly. The RLS SELECT policy is intentionally narrow — users can only see their own profile.

---

## Table: `payment_requests`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | `pr_select` | `sender_id = auth.uid()` OR `recipient_id = auth.uid()` OR `recipient_email = (SELECT email FROM profiles WHERE id = auth.uid())` |
| INSERT | `pr_insert` | `sender_id = auth.uid()` (enforces sender = logged-in user) |
| UPDATE (cancel) | `pr_sender_cancel` | USING: `sender_id = auth.uid()` / WITH CHECK: `status = 'cancelled'` |
| UPDATE (pay/decline) | `pr_recipient_action` | USING: `recipient_id = auth.uid()` OR `recipient_email = (SELECT email FROM profiles WHERE id = auth.uid())` / WITH CHECK: `status IN ('pending','paid','declined')` ¹ |
| DELETE | _(none)_ | Soft deletes only via status transitions |

¹ The WITH CHECK includes `'pending'` to allow the system to write `expired` before transitioning — but in practice the service role bypasses this policy for expiry writes.

**Service role bypass cases**:
- Writing `status='expired'` (system-initiated, not user-initiated — bypasses UPDATE policy)
- Fetching request data for unauthenticated viewers on `/request/[id]`
- Fetching request for validation inside server actions (before RLS-aware update)

---

## Table: `audit_logs`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | _(none granted to authenticated/anon roles)_ | Admin access only via service role or Supabase dashboard |
| INSERT | `audit_logs_insert` | `WITH CHECK (true)` — any authenticated user or service role can insert |
| UPDATE | _(none)_ | Immutability enforced at DB layer |
| DELETE | _(none)_ | Immutability enforced at DB layer |

**Key design**: No UPDATE or DELETE policy is defined. Even if application code tries to update or delete a log entry, PostgreSQL rejects it. The service role bypasses RLS but the application service role client never issues UPDATE/DELETE on this table.

---

## Table: `login_attempts`

| Operation | Policy | Condition |
|-----------|--------|-----------|
| SELECT | _(none for authenticated/anon)_ | Service role only |
| INSERT | _(service role only)_ | No RLS defined; table does not have RLS enabled |
| UPDATE | _(none)_ | |
| DELETE | _(none)_ | |

**Notes**: `login_attempts` does not have RLS enabled. All reads and writes go through the service role client exclusively (inside `loginAction`). No user can directly query this table via the Supabase client.

---

## Service Role Usage Map

| Server file | Service role used for |
|-------------|----------------------|
| `src/lib/audit.ts` | Writing to `audit_logs` |
| `src/actions/auth.ts` | Reading/writing `login_attempts` |
| `src/actions/requests.ts` | Reading request for validation; writing expiry update; writing status transitions |
| `src/app/request/[id]/page.tsx` | Fetching request + sender profile for unauthenticated viewers |

**Never used in**:
- Client components (`'use client'` files)
- Any `NEXT_PUBLIC_` environment variable
- Browser-side code paths
