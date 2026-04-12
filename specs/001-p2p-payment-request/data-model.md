# Data Model: P2P Payment Request

**Feature**: 001-p2p-payment-request | **Date**: 2026-04-10

---

## Entities

### 1. User (managed by Supabase Auth)

Supabase Auth stores the canonical user record in `auth.users`. Application code reads user identity from `auth.getUser()` — never from client-provided parameters.

**Key attributes from auth.users** (read-only from application):
- `id` — uuid, primary key
- `email` — text
- `created_at` — timestamptz

### 2. Profile

A denormalized mirror of the auth user, auto-created by a DB trigger on `auth.users INSERT`. Stores app-facing user data.

**Table**: `profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, references `auth.users(id)` | Same ID as auth user |
| `email` | text | NOT NULL, UNIQUE | Copied from auth.users on creation |
| `phone` | text | NULLABLE | MVP: not used for recipient matching |
| `display_name` | text | NULLABLE | Optional, not shown in MVP UI |
| `created_at` | timestamptz | DEFAULT now() | |

**Trigger**: `handle_new_user()` fires AFTER INSERT ON `auth.users`, inserts a matching profile row (SECURITY DEFINER).

**Validation rules**:
- `email` must be unique — enforced by DB UNIQUE constraint
- Phone field exists in schema but is NOT used for incoming request matching in MVP (see research.md Decision 7)

---

### 3. PaymentRequest

The core entity. Represents a formal request from one user to another for money.

**Table**: `payment_requests`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | The shareable UUID in /request/{id} |
| `sender_id` | uuid | NOT NULL, FK → profiles(id) | The requesting user |
| `recipient_email` | text | NULLABLE | Set if recipient identified by email |
| `recipient_phone` | text | NULLABLE | Set if recipient identified by phone (normalized 10 digits) |
| `recipient_id` | uuid | NULLABLE, FK → profiles(id) | Populated when recipient has an account and email matches |
| `amount_cents` | integer | NOT NULL, CHECK > 0 AND ≤ 1,000,000 | Stored as cents; $0.01=1, $10,000=1,000,000 |
| `note` | text | NULLABLE, CHECK char_length ≤ 280 | Plain text only, trimmed |
| `status` | text | NOT NULL, DEFAULT 'pending', CHECK IN enum | See state machine below |
| `created_at` | timestamptz | DEFAULT now() | |
| `expires_at` | timestamptz | DEFAULT now() + interval '7 days' | Expiry deadline |
| `paid_at` | timestamptz | NULLABLE | Set when status → 'paid' |
| `declined_at` | timestamptz | NULLABLE | Set when status → 'declined' |

**Constraints**:
- Exactly one of `recipient_email` or `recipient_phone` must be non-null (enforced at application layer in server action, not DB CHECK for flexibility)
- `recipient_email` is stored as-is (original casing preserved, lowercased before comparison)
- `recipient_phone` is stored as normalized 10-digit string (e.g., `"5551234567"`)

**Indexes**:
```sql
CREATE INDEX idx_pr_sender ON payment_requests(sender_id);
CREATE INDEX idx_pr_recipient_email ON payment_requests(recipient_email);
CREATE INDEX idx_pr_status ON payment_requests(status);
CREATE INDEX idx_pr_expires ON payment_requests(expires_at) WHERE status = 'pending';
```

---

### 4. AuditLog

Immutable append-only record of all status transitions and authentication events. Required by FR-042 through FR-045.

**Table**: `audit_logs`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `event_type` | text | NOT NULL | See event types below |
| `actor_id` | uuid | NULLABLE | References auth.users(id) — NO FK constraint (log survives user deletion) |
| `actor_email` | text | NULLABLE | Denormalized for log readability |
| `target_id` | uuid | NULLABLE | payment_request id for status_transition events |
| `previous_value` | text | NULLABLE | Previous status for status_transition events |
| `new_value` | text | NULLABLE | New status for status_transition events |
| `metadata` | jsonb | NULLABLE | Extensible context (e.g., IP, user agent — future) |
| `created_at` | timestamptz | DEFAULT now() | |

**Event types**:
- `status_transition` — any payment_request status change (pending→paid, pending→declined, etc.)
- `login_success` — successful authentication
- `login_failure` — failed authentication attempt
- `logout` — explicit logout
- `session_expired` — idle timer triggered logout

**RLS**: INSERT allowed for all; NO UPDATE; NO DELETE granted to any role. Writes use the service role client exclusively.

---

### 5. LoginAttempt

Rolling log of login attempts per email, used for rate limiting (FR-006c).

**Table**: `login_attempts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | |
| `email` | text | NOT NULL | The email attempted |
| `attempted_at` | timestamptz | DEFAULT now() | |
| `success` | boolean | NOT NULL | Whether the attempt succeeded |

**Index**: `(email, attempted_at DESC)` for fast rolling-window queries.

**Rate limit query**:
```sql
SELECT COUNT(*) FROM login_attempts
WHERE email = $1
  AND attempted_at > NOW() - INTERVAL '15 minutes'
  AND success = false;
-- If COUNT >= 5 → block
```

---

## State Machine: PaymentRequest Status

```
             ┌─────────┐
             │ PENDING │
             └────┬────┘
                  │
      ┌───────────┼───────────┬──────────┐
      ▼           ▼           ▼          ▼
  ┌──────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐
  │ PAID │  │ DECLINED │  │CANCELLED│  │ EXPIRED │
  └──────┘  └──────────┘  └─────────┘  └─────────┘
```

| Transition | Actor | Trigger | Sets |
|-----------|-------|---------|------|
| pending → paid | Recipient | Clicks "Pay", confirms | `status='paid'`, `paid_at=now()` |
| pending → declined | Recipient | Clicks "Decline", confirms dialog | `status='declined'`, `declined_at=now()` |
| pending → cancelled | Sender | Clicks "Cancel", confirms dialog | `status='cancelled'` |
| pending → expired | System | `expires_at < now()` detected on read/action | `status='expired'` |

**Rules**:
- All transitions originate from `pending` only — terminal states are irreversible (FR-034)
- The system transition (pending → expired) is applied lazily: detected in `applyExpiryToRequest()` on reads, written to DB when a status-transition action is attempted on an expired request

---

## Relationships

```
auth.users (Supabase managed)
    │
    │ 1:1 trigger
    ▼
profiles
    │
    │ 1:N (sender)
    ▼
payment_requests ◄─── profiles (recipient_id, nullable)
    │
    │ 1:N (via target_id)
    ▼
audit_logs

login_attempts (standalone, keyed by email string)
```

---

## TypeScript Interfaces

```typescript
// src/types/database.ts

export type PaymentRequestStatus =
  | 'pending'
  | 'paid'
  | 'declined'
  | 'cancelled'
  | 'expired';

export interface Profile {
  id: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  sender_id: string;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_id: string | null;
  amount_cents: number;
  note: string | null;
  status: PaymentRequestStatus;
  created_at: string;
  expires_at: string;
  paid_at: string | null;
  declined_at: string | null;
}

export interface AuditLog {
  id: string;
  event_type: string;
  actor_id: string | null;
  actor_email: string | null;
  target_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  attempted_at: string;
  success: boolean;
}
```

---

## Validation Rules (application-layer)

| Field | Rule | Error Message |
|-------|------|---------------|
| `recipient` | Valid email format OR normalized 10-digit US phone | "Please enter a valid email address" / "Please enter a valid US phone number (10 digits)" |
| `recipient` | Must not match sender's registered email | "You cannot request money from yourself" |
| `amount` | Regex `/^\d+(\.\d{1,2})?$/` (≤2 decimal places) | "Amount can have at most 2 decimal places" |
| `amount` | `parseFloat(amount) * 100 >= 1` (≥ $0.01) | "Amount must be greater than $0.00" |
| `amount` | `parseFloat(amount) * 100 <= 1000000` (≤ $10,000.00) | "Amount cannot exceed $10,000.00" |
| `note` | 0–280 characters after trim | Character counter turns red; submit disabled |
| `note` | Plain text only | No HTML/markdown rendered — stored and displayed as-is |
