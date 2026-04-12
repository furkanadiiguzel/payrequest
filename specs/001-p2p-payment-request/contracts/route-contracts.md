# Contract: Route Rendering Contracts

**Feature**: 001-p2p-payment-request | **Date**: 2026-04-10

Each route has a defined rendering contract specifying what is shown and what actions are available based on the viewer's authentication state and relationship to the data.

---

## `/` (Root)

| Condition | Behaviour |
|-----------|-----------|
| Authenticated | Redirect → `/dashboard` |
| Unauthenticated | Redirect → `/login` |

**Implementation**: Server component reads session via `supabase.auth.getUser()`. Uses `redirect()` (Next.js).

---

## `/login`

| Condition | Behaviour |
|-----------|-----------|
| Authenticated | Redirect → `/dashboard` (middleware) |
| Unauthenticated | Render login form |

**Renders**: Email + password form, link to `/signup`.
**On success**: Redirect to `returnUrl` query param (if valid, starts with `/`) or `/dashboard`.
**On failure**: Inline error "Invalid email or password".
**On rate-limited**: Inline error "Account temporarily locked. Try again after 15 minutes."

---

## `/signup`

| Condition | Behaviour |
|-----------|-----------|
| Authenticated | Redirect → `/dashboard` (middleware) |
| Unauthenticated | Render signup form |

**Renders**: Email + password form, link to `/login`.
**On success**: Auto-login, redirect → `/dashboard`.
**On failure**: Inline error (e.g., "User already registered").

---

## `/dashboard`

| Condition | Behaviour |
|-----------|-----------|
| Authenticated | Render dashboard with Sent/Received tabs |
| Unauthenticated | Middleware redirects → `/login?returnUrl=%2Fdashboard` |

**Renders**:
- Sent tab: requests where `sender_id = user.id`, sorted `created_at DESC`, limit 50
- Received tab: requests where `recipient_email = user.email`, sorted `created_at DESC`, limit 50
- Status filter dropdown (All/Pending/Paid/Declined/Expired/Cancelled)
- Search input (client-side filter on counterparty identifier)
- Request cards with: counterparty, $XX.XX amount, 50-char note preview, status badge, relative timestamp

**Empty states**:
- No requests at all → "No requests yet. Send your first request!" + CTA
- Filters produce no results → "No requests match your filters." + "Clear filters" link

---

## `/request/new`

| Condition | Behaviour |
|-----------|-----------|
| Authenticated | Render create-request form |
| Unauthenticated | Middleware redirects → `/login?returnUrl=%2Frequest%2Fnew` |

**Renders**: Recipient field (auto-detects email/phone), amount field ($0.01–$10,000.00), note field (0–280 chars with counter), form-level and field-level inline validation.

**On success**: Renders SuccessScreen (no route change) with shareable link, copy button, "Send another" and "Go to dashboard" options. Auto-redirects to `/dashboard` after 3 seconds.

---

## `/request/[id]`

This route has four distinct rendering states determined server-side.

### State 1: Unauthenticated Viewer

**Data source**: Service role client (bypasses RLS).
**Rendered fields**: Amount ($XX.XX), full note (if present), masked sender email (`j***@gmail.com`), status badge.
**Not rendered**: Full sender email, recipient identifier, sender_id, action buttons.
**CTA**: "Log in to respond" button → `/login?returnUrl=/request/{id}`, plus "Sign up" link.
**Expiry**: If expired, show "This request has expired" banner above details.

### State 2: Authenticated Sender (viewer is `sender_id`)

**Data source**: Authenticated Supabase client (subject to RLS SELECT policy).
**Rendered fields**: All request details (amount, full note, recipient identifier, sender email, status badge, created_at, expires_at countdown for pending).
**Actions (pending only)**:
- "Cancel Request" button → triggers `cancelRequest()` via confirmation Dialog
- "Copy Link" button → copies `/request/{id}` URL to clipboard
**Non-pending**: No action buttons; shows terminal timestamp (e.g., "Paid on March 16, 2025").

### State 3: Authenticated Recipient (viewer matches `recipient_email` or `recipient_id`)

**Data source**: Authenticated Supabase client.
**Rendered fields**: Same as sender.
**Actions (pending only)**:
- "Pay" button (primary green) → triggers `payRequest()` with loading state; on success renders `PaymentSuccessOverlay`
- "Decline" button (secondary red outline) → triggers confirmation Dialog, then `declineRequest()`
**Non-pending**: No action buttons; shows terminal timestamp.

### State 4: Authenticated Unrelated User

**Behaviour**: `notFound()` — renders 404 page (`src/app/request/[id]/not-found.tsx`).
**Note**: Do not distinguish between "request doesn't exist" and "viewer is unrelated" — both show 404 to prevent enumeration.

---

## Middleware Behaviour

**Protected routes** (redirect to `/login?returnUrl=<encoded>` if unauthenticated):
- `/dashboard`
- `/request/new`

**Auth routes** (redirect to `/dashboard` if already authenticated):
- `/login`
- `/signup`

**Public routes** (no middleware intervention):
- `/request/[id]` — handled server-side with viewer-state detection
- `/` — handled server-side with redirect logic

---

## PaymentSuccessOverlay

Rendered as a full-screen overlay (fixed, z-50) after `payRequest()` resolves successfully. Not a separate route.

**Renders**: "Payment of $XX.XX sent to [sender email]!", checkmark animation, "Back to Dashboard" button.
**Auto-redirect**: `/dashboard` after 3 seconds (clears on unmount).
