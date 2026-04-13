# Feature Specification: P2P Payment Request

**Feature Branch**: `001-p2p-payment-request`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Build a P2P Payment Request feature for a consumer fintech web application called PayRequest."

## Clarifications

### Session 2026-04-10

- Q: Does this MVP have any regulatory or compliance obligations that constrain how user data, session management, or the "simulated" payment records must be handled? → A: Light fintech compliance in scope — audit trail for all status transitions, session timeout enforced
- Q: For requests sent to a phone number, how should the Received tab identify the correct recipient once they sign up? → A: Phone-sent requests are not surfaced in the Received tab — accessible only via the direct shareable link
- Q: Should the full note be visible to unauthenticated users on the public shareable link? → A: Full note visible to anyone with the link — sender accepts responsibility for content
- Q: Should the system enforce any protection against repeated failed login attempts? → A: Rate-limit login attempts per email — temporary block after a defined number of consecutive failures, with a user-visible message
- Q: Should the spec define a user-perceived page-load target for the dashboard and request detail pages? → A: Yes — dashboard and detail pages must load and display content within 2 seconds under normal conditions

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Authentication (Priority: P1)

A new or returning user registers or logs in to access PayRequest. Without an authenticated session, users cannot create or respond to payment requests.

**Why this priority**: All other functionality depends on a verified user identity. This is the entry gate to every protected feature — no downstream story is testable without it.

**Independent Test**: Can be fully tested by signing up with a valid email, phone number, and password, verifying auto-login and dashboard redirect, then logging out and logging back in with those credentials. Delivers a complete auth loop independent of payment functionality.

**Acceptance Scenarios**:

1. **Given** an unregistered visitor on /signup, **When** they submit a valid email, a valid phone number (country code + local number), and a password of at least 6 characters, **Then** they are automatically logged in and redirected to /dashboard
2. **Given** a sign-up attempt using an email already registered, **When** submitted, **Then** an inline error describes the conflict and the user remains on /signup
3. **Given** a sign-up attempt with a password shorter than 6 characters, **When** submitted, **Then** an inline error is shown and the form is not submitted
4. **Given** a sign-up attempt with no phone number entered, **When** submitted, **Then** an inline error appears: "Phone number is required"
5. **Given** a registered user on /login, **When** they submit correct credentials, **Then** they are redirected to /dashboard (or to the preserved return URL if one exists)
6. **Given** a registered user on /login, **When** they submit incorrect credentials, **Then** they see the message "Invalid email or password"
7. **Given** a logged-in user, **When** they click "Log Out" in the navigation menu, **Then** their session is cleared and they are redirected to /login
8. **Given** an unauthenticated visitor accessing a protected route (e.g., /dashboard), **When** they land on that URL, **Then** they are redirected to /login with the original URL preserved as a return URL
9. **Given** a user who has exceeded the consecutive failed login limit for their email address, **When** they attempt another login, **Then** further attempts are temporarily blocked and a message informs them the account is locked (specific threshold and lockout duration are defined during planning)

---

### User Story 2 - Create a Payment Request (Priority: P2)

A logged-in user sends a payment request to another person by specifying a recipient (email address or international phone number with country code), a dollar amount, and an optional short note.

**Why this priority**: Creating a payment request is the core action that generates all downstream value. Without at least one request, the dashboard, detail view, and all action flows have nothing to operate on.

**Independent Test**: Can be fully tested by filling in the create-request form with valid inputs and verifying the success confirmation screen appears with a shareable link. Delivers the primary product value proposition independently.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the new-request form, **When** they enter a valid email, a valid amount, an optional note, and click "Send Request", **Then** a request is created with status "pending" and an expiry 7 days from now, and a success screen appears with a copyable shareable link
2. **Given** the recipient field in "Phone" mode, **When** the user selects a country (e.g., Turkey +90) and enters a local number, **Then** the full E.164 number (e.g., +905321234567) is submitted and the request is created successfully
3. **Given** the recipient toggle, **When** the user switches between "Email" and "Phone" modes, **Then** the input field changes accordingly and any previous value is cleared
4. **Given** a recipient identifier that is an invalid email format (in Email mode), **When** submitted, **Then** an inline error appears: "Enter a valid email address or phone number"
5. **Given** a phone number that does not meet E.164 format (in Phone mode), **When** submitted, **Then** an inline error appears: "Enter a valid email address or phone number"
5. **Given** an amount of $0.00 or less, **When** submitted, **Then** an inline error appears: "Amount must be greater than $0.00"
6. **Given** an amount exceeding $10,000.00, **When** submitted, **Then** an inline error appears: "Amount cannot exceed $10,000.00"
7. **Given** an amount with more than 2 decimal places (e.g., "25.555"), **When** submitted, **Then** an inline error appears: "Amount can have at most 2 decimal places"
8. **Given** a note field where the user types beyond 280 characters, **When** the character count exceeds the limit, **Then** the character counter turns red and the submit button is disabled
9. **Given** a user entering their own registered email as the recipient, **When** submitted, **Then** an inline error appears: "You cannot request money from yourself"
10. **Given** the success confirmation screen, **When** the user clicks "Copy Link", **Then** the shareable request URL is copied to the clipboard
11. **Given** the success confirmation screen, **When** 3 seconds elapse or the user clicks "Go to dashboard", **Then** the user is redirected to /dashboard
12. **Given** a network failure during request submission, **When** the error occurs, **Then** a toast notification appears: "Something went wrong. Please try again."

---

### User Story 3 - View & Manage Request Dashboard (Priority: P3)

A logged-in user tracks all their sent and received payment requests in a tabbed dashboard with filtering and free-text search.

**Why this priority**: Once requests exist, users need visibility into their lifecycle. This is the ongoing management surface of the product and the default landing page after login.

**Independent Test**: Can be tested after creating multiple requests by verifying they appear correctly in the Sent tab with proper badges, amounts, and timestamps — and that filtering by status and searching by counterparty reduce the list correctly.

**Acceptance Scenarios**:

1. **Given** a logged-in user navigating to /dashboard, **When** the page loads, **Then** the "Sent" tab is active by default, showing all outgoing requests sorted newest-first
2. **Given** the dashboard, **When** the user clicks the "Received" tab, **Then** all incoming requests addressed to the user's registered email are shown, sorted newest-first
3. **Given** a request card on either tab, **When** displayed, **Then** it shows: counterparty identifier, amount formatted as $XX.XX, note preview (first 50 characters with "..." if longer), a color-coded status badge, and a relative timestamp (e.g., "2 hours ago")
4. **Given** the status filter set to "Pending", **When** applied, **Then** only pending requests are visible; other filters work the same way for their respective statuses
5. **Given** a search query entered in the search field, **When** typed, **Then** only requests whose counterparty identifier contains the query (case-insensitive) are shown
6. **Given** both a status filter and a search query are active, **When** applied together, **Then** only requests matching both conditions are shown
7. **Given** a tab with no requests at all, **When** displayed, **Then** an empty state shows: "No requests yet. Send your first request!" with a call-to-action button
8. **Given** active filters or search with no matching results, **When** applied, **Then** the message "No requests match your filters." is shown with a "Clear filters" link
9. **Given** a request card, **When** clicked, **Then** the user is navigated to /request/{uuid}

---

### User Story 4 - View Request Detail & Take Actions (Priority: P4)

A logged-in sender or recipient views the complete details of a specific payment request and takes the appropriate action: pay, decline, cancel, or copy the link.

**Why this priority**: Viewing and acting on requests completes the money-request loop. Without this, requests can be created and tracked but never resolved.

**Independent Test**: Can be tested by navigating directly to a known request URL, verifying all detail fields are displayed correctly, then performing an action (e.g., cancellation by sender) and confirming the status transitions and redirect behavior.

**Acceptance Scenarios**:

1. **Given** a logged-in recipient on the detail page of a pending request addressed to them, **When** the page loads, **Then** "Pay" and "Decline" buttons are shown alongside the full request details
2. **Given** a recipient clicking "Pay", **When** clicked, **Then** the button immediately shows a loading spinner and becomes disabled; after 2–3 seconds the status transitions to "paid" and a full-screen success overlay appears
3. **Given** the payment success overlay, **When** displayed, **Then** it shows "Payment of $XX.XX sent to [sender email]!" with a "Back to Dashboard" button, and redirects to /dashboard after 3 seconds
4. **Given** a recipient clicking "Decline", **When** clicked, **Then** a confirmation dialog appears: "Are you sure you want to decline this request for $XX.XX from [sender]?"
5. **Given** the decline confirmation dialog, **When** the user confirms, **Then** the status transitions to "declined" with a timestamp recorded and the user is redirected to /dashboard
6. **Given** the decline confirmation dialog, **When** the user cancels, **Then** the dialog closes and no change occurs
7. **Given** a logged-in sender on the detail page of a pending request they created, **When** the page loads, **Then** "Cancel Request" and "Copy Link" buttons are shown
8. **Given** a sender clicking "Cancel Request", **When** clicked, **Then** a confirmation dialog appears: "Are you sure you want to cancel this request?"
9. **Given** the cancel confirmation dialog, **When** the user confirms, **Then** the status transitions to "cancelled" and the user is redirected to /dashboard
10. **Given** a request in any terminal state (paid, declined, cancelled, expired), **When** viewed by any authorized party, **Then** no action buttons appear, and the page shows when the terminal status was reached (e.g., "Paid on March 16, 2025")
11. **Given** a logged-in user who is neither the sender nor the recipient of a request, **When** accessing /request/{uuid}, **Then** a 404 page is shown
12. **Given** a pending request whose expiry has passed between page load and when the recipient clicks "Pay", **When** the action is attempted, **Then** an error is shown: "This request has expired"
13. **Given** a pending outgoing request detail page, **When** the sender clicks "Copy Link", **Then** the shareable URL is copied to the clipboard

---

### User Story 5 - Request Expiration (Priority: P5)

Payment requests automatically transition to "expired" status 7 days after creation. Expired requests are read-only and display clear expiration information.

**Why this priority**: Expiration enforces time boundaries on financial commitments, reduces stale-pending data, and prevents indefinite outstanding balances — important for user trust and financial clarity.

**Independent Test**: Can be tested by reading a request whose expiry timestamp is set in the past and verifying the status shows as "expired" with no action buttons, without requiring any manual administrative action.

**Acceptance Scenarios**:

1. **Given** a pending request whose expiry timestamp is earlier than the current time, **When** it is loaded on the dashboard or detail page, **Then** its status is updated to "expired" before the data is returned to the user
2. **Given** an expired request on the dashboard, **When** displayed as a card, **Then** a gray "Expired" badge is shown
3. **Given** an expired request on the detail page, **When** viewed, **Then** the message "This request expired on [date]" is shown and no action buttons are present
4. **Given** a shareable link for an expired request accessed by any user, **When** the page loads, **Then** the request details are shown alongside a banner reading "This request has expired"

---

### User Story 6 - Shareable Link & Unauthenticated Access (Priority: P6)

Anyone who receives a request link can view the basic request details without an account. Logging in as the intended recipient unlocks the ability to respond.

**Why this priority**: Shareable links allow recipients who are not yet users to discover and review requests, which is critical for viral adoption and new-user conversion from the recipient side.

**Independent Test**: Can be tested by opening a request URL in a logged-out browser session and verifying the partially masked sender email, the amount, and the "Log in to respond" button appear correctly — without any authenticated user data being exposed.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on /request/{uuid}, **When** the page loads, **Then** the amount, note (if present), and sender email (partially masked: first character + "***" + "@" + domain, e.g., "j***@gmail.com") are shown
2. **Given** an unauthenticated visitor, **When** on the request page, **Then** a prominent "Log in to respond" button and a "Sign up" option are both visible
3. **Given** the "Log in to respond" button, **When** clicked, **Then** the visitor is redirected to /login with the return URL set to this request page
4. **Given** a user who logs in after being redirected from a request link, **When** successfully authenticated as the recipient, **Then** they are returned to the request detail page with full details and action buttons visible
5. **Given** a logged-in user who is neither sender nor recipient, **When** accessing /request/{uuid}, **Then** a 404 page is shown (no request details exposed)

---

### Edge Cases

- What happens when a request is loaded after expiry but before the status field is updated in storage — the expiry check happens on every read, so the caller always receives the correct expired status
- How does the system handle a double-click on "Pay" — the button is disabled immediately on the first click, preventing duplicate payment simulations from being triggered
- What if the note contains HTML or markdown characters — the note is stored and rendered as plain text only; no HTML or markdown is interpreted or rendered
- What happens when a sender's email is different from a phone-based recipient identifier — self-request validation only blocks the case where the recipient identifier exactly matches the sender's registered email; mismatched identifier types are not blocked
- What if no existing account has the recipient's email or phone — the request is created regardless; recipient account creation is not required at request-creation time
- What if a user sends multiple requests to the same recipient — this is explicitly allowed; no uniqueness constraint exists on sender + recipient pairs
- What happens to a request sent to a phone number from the recipient's dashboard — it does not appear in the Received tab; the only way to access it is via the shareable link (/request/{uuid})

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication**

- **FR-001**: System MUST allow users to register with an email address, a phone number (country code + local number in E.164 format), and a password of at least 6 characters; all three fields are mandatory
- **FR-001a**: System MUST provide a country selector on the signup form showing country flag, name, and dial code (e.g., 🇹🇷 Turkey +90); default selection is Turkey (+90)
- **FR-001b**: System MUST store the user's phone number in E.164 format (e.g., +905321234567) in their profile record at sign-up time
- **FR-002**: System MUST automatically log in a newly registered user and redirect them to /dashboard
- **FR-003**: System MUST authenticate registered users via email and password and redirect them to /dashboard or a preserved return URL
- **FR-004**: System MUST show the message "Invalid email or password" on failed login attempts
- **FR-005**: System MUST allow a logged-in user to log out, clearing their session and redirecting to /login
- **FR-006**: System MUST redirect unauthenticated users attempting to access protected routes to /login with the original URL preserved as a return parameter
- **FR-006a**: System MUST enforce a session inactivity timeout; sessions idle beyond the timeout period MUST be invalidated and the user redirected to /login
- **FR-006b**: System MUST enforce a maximum absolute session lifetime regardless of activity
- **FR-006c**: System MUST temporarily block login attempts for an email address after a defined number of consecutive failures, displaying a user-visible lockout message; the threshold and lockout duration are determined during planning (typical default: 5 attempts, 15-minute lockout)

**Payment Request Creation**

- **FR-007**: System MUST allow a logged-in user to create a payment request specifying: a recipient identifier (email or international phone number), a dollar amount, and an optional note
- **FR-007a**: System MUST provide an Email / Phone toggle on the request form; selecting "Phone" reveals a country selector (same country list as signup) and a local number input that together produce an E.164 recipient value
- **FR-007b**: Switching between Email and Phone mode MUST clear the recipient field and any existing validation errors for that field
- **FR-008**: System MUST assign each new request a unique ID, a status of "pending", and an expiry timestamp exactly 7 days after the creation timestamp
- **FR-009**: System MUST accept dollar amounts from $0.01 to $10,000.00 with at most 2 decimal places, and store the value as integer cents
- **FR-010**: System MUST validate that a recipient identifier is either a properly formatted email address or a valid E.164 phone number (starts with +, followed by 7–15 digits)
- **FR-011**: System MUST reject a request where the recipient identifier exactly matches the logged-in user's registered email address, showing: "You cannot request money from yourself"
- **FR-012**: System MUST accept notes of 0–280 characters in plain text, trimmed of leading and trailing whitespace, and reject notes that exceed 280 characters with a red character counter and disabled submit button
- **FR-013**: System MUST display a success confirmation screen after creation, showing a copyable shareable link (/request/{uuid}) with options to "Send another" or "Go to dashboard"
- **FR-014**: System MUST automatically redirect the user from the success confirmation screen to /dashboard after 3 seconds unless the user navigates away first
- **FR-015**: System MUST display a toast notification "Something went wrong. Please try again." on network or server errors during request submission

**Dashboard**

- **FR-016**: System MUST display a /dashboard page with "Sent" and "Received" tabs, with "Sent" active by default
- **FR-017**: System MUST populate the Sent tab with all requests where the logged-in user is the sender, sorted by creation date descending
- **FR-018**: System MUST populate the Received tab with all requests where the recipient identifier exactly matches the logged-in user's registered email address, sorted by creation date descending; requests addressed to a phone number are never surfaced in the Received tab regardless of who is logged in
- **FR-019**: System MUST render each request as a card showing: counterparty identifier, amount in $XX.XX format, note truncated to 50 characters with "..." if longer, a color-coded status badge, and a relative timestamp
- **FR-020**: System MUST apply status badge colors as follows: pending = amber/yellow, paid = green, declined = red, expired = gray, cancelled = gray with strikethrough text
- **FR-021**: System MUST provide a status filter dropdown (All, Pending, Paid, Declined, Expired, Cancelled) and a free-text search on counterparty identifier; both filters operate together with AND logic and update results immediately without a page reload
- **FR-022**: System MUST show "No requests yet. Send your first request!" with a CTA button when a tab has no requests at all
- **FR-023**: System MUST show "No requests match your filters." with a "Clear filters" link when active filters produce no results
- **FR-024**: System MUST navigate to /request/{uuid} when a request card is clicked

**Request Detail**

- **FR-025**: System MUST display a detail page at /request/{uuid} showing: amount (large and prominent), note (full text, if present), sender email, recipient identifier, status badge, creation timestamp, and expiry countdown or date for pending requests
- **FR-026**: System MUST show "Pay" and "Decline" action buttons exclusively to the logged-in recipient of a pending request
- **FR-027**: System MUST show "Cancel Request" and "Copy Link" buttons exclusively to the logged-in sender of a pending request
- **FR-028**: System MUST show no action buttons for requests in any terminal state, and instead display the timestamp of when that state was reached
- **FR-029**: System MUST return a 404 response when a logged-in user who is neither sender nor recipient accesses /request/{uuid}

**Status Transitions**

- **FR-030**: System MUST transition a request from "pending" to "paid" when the recipient confirms payment, recording a paid_at timestamp
- **FR-031**: System MUST transition a request from "pending" to "declined" when the recipient confirms via dialog, recording a declined_at timestamp
- **FR-032**: System MUST transition a request from "pending" to "cancelled" when the sender confirms via dialog
- **FR-033**: System MUST transition a request from "pending" to "expired" when it is read and its expiry timestamp is earlier than the current time
- **FR-034**: System MUST reject any status-change attempt on a request already in a terminal state (paid, declined, cancelled, expired)

**Payment Simulation**

- **FR-035**: System MUST disable the Pay button immediately on first click to prevent duplicate submissions
- **FR-036**: System MUST show a loading spinner and "Processing..." text on the Pay button during the simulated processing delay of 2–3 seconds
- **FR-037**: System MUST display a full-screen success overlay after payment simulation completes, showing "Payment of $XX.XX sent to [sender email]!" and a "Back to Dashboard" button
- **FR-038**: System MUST redirect the user from the payment success overlay to /dashboard after 3 seconds unless they navigate away first

**Unauthenticated Request Access**

- **FR-039**: System MUST allow unauthenticated users to view /request/{uuid} showing: amount, full note (if present), and sender email partially masked (first character + "***" + "@" + domain); the note is intentionally public — senders are responsible for its content
- **FR-040**: System MUST display a "Log in to respond" button and a "Sign up" option to unauthenticated visitors on a request page
- **FR-041**: System MUST redirect unauthenticated visitors from "Log in to respond" to /login with the return URL set to the current request page

**Compliance & Audit**

- **FR-042**: System MUST record an immutable audit log entry for every payment request status transition, capturing: the previous status, the new status, the acting user's identifier, and a timestamp
- **FR-043**: System MUST record an audit log entry for all authentication events: successful login, failed login attempt, logout, and session expiry
- **FR-044**: Audit log entries MUST NOT be deletable or modifiable by any user action within the application
- **FR-045**: System MUST make audit log data available for internal review (e.g., by an administrator or via direct data access) — no end-user UI is required for MVP

### Key Entities

- **User**: A registered account holder identified by a unique ID and email address. Can act as sender and/or recipient across multiple payment requests.
- **Payment Request**: A formal money request between two parties. Key attributes: unique UUID, sender reference, recipient identifier (email or phone as plain text), amount in integer cents, optional note (≤280 chars, plain text), status (pending/paid/declined/cancelled/expired), created_at, expires_at (created_at + 7 days), and optional terminal timestamps (paid_at, declined_at).
- **Request Status**: An enumerated lifecycle state. Valid values: pending, paid, declined, cancelled, expired. All transitions originate from "pending" only; terminal states are irreversible.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the entire create-request flow — from opening the form to seeing the success confirmation — in under 60 seconds under normal conditions
- **SC-002**: Every request whose expiry date has passed displays as "expired" on the very next load — zero requests are shown as "pending" when their expiry is in the past
- **SC-003**: All status transitions (pay, decline, cancel, expire) are irreversible — once a terminal state is reached, no further status changes are possible
- **SC-004**: A logged-in user can only view requests in which they are the sender or the recipient — no request details are exposed to unrelated users
- **SC-005**: Unauthenticated users can open a shareable request link and see the amount and masked sender email without any account — the link works publicly with no login requirement to view
- **SC-006**: The "Pay" action is executed at most once per request regardless of how quickly the user clicks — double-click protection makes payment simulation idempotent
- **SC-007**: Every form input provides inline validation feedback before submission — users never receive a first-time validation error from the server for client-detectable rules
- **SC-008**: Users can complete the full request lifecycle (create → share link → recipient logs in → pay or decline) end-to-end without encountering unhandled errors
- **SC-009**: Every status transition (pending → paid/declined/cancelled/expired) produces exactly one corresponding audit log entry — zero unlogged transitions occur
- **SC-010**: Every authentication event (login success, login failure, logout, session expiry) produces an audit log entry — audit coverage is 100% for auth events
- **SC-011**: Sessions do not persist beyond the defined inactivity or absolute lifetime thresholds — no active session survives both limits
- **SC-012**: After the defined consecutive failure threshold, no further login attempts succeed for that email until the lockout period expires — brute-force enumeration is blocked at the application layer
- **SC-013**: The dashboard page (both Sent and Received tabs) displays its full list of requests within 2 seconds of navigation under normal load conditions
- **SC-014**: The request detail page displays complete request information within 2 seconds of navigation under normal load conditions

---

## Assumptions

- Authentication requires email, phone number, and password; phone is stored in E.164 format in the user profile at sign-up; phone verification (SMS OTP) is out of scope for MVP
- Light fintech compliance is in scope: all status transitions and authentication events must be recorded in an immutable audit trail; sessions must have enforced inactivity and absolute lifetime limits
- Specific numeric thresholds for session timeout and absolute session lifetime are to be determined during planning (typical fintech defaults: 30-minute inactivity, 8-hour absolute maximum)
- PCI-DSS, BSA/AML, and KYC obligations are not triggered because no real funds transfer occurs; those compliance layers are deferred to when real payment rails are introduced
- The Received tab matches incoming requests against the logged-in user's registered email address only; requests sent to a phone number are accessible only via the direct shareable link, not through the Received tab
- No email or SMS notifications are sent for MVP — users discover incoming requests by checking the dashboard or following a shared link
- No real payment processing or financial transfer occurs — the "Pay" action is simulated with a 2–3 second artificial delay
- The partially masked sender email format for unauthenticated views is: first character of the local part, then "***", then "@", then the full domain (e.g., "j***@gmail.com")
- Multiple pending requests from the same sender to the same recipient are allowed without restriction
- Request creation is not rate-limited for MVP
- The dashboard loads the 50 most recent requests per tab when the total is large; no pagination controls are provided
- Confirmation dialogs for the Decline and Cancel actions are modal overlays, not full-page navigations
- The "Send another" option on the success screen navigates back to the create-request form with a blank form
