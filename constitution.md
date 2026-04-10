# PayRequest Constitution

## Project Identity
- Name: PayRequest
- Type: Consumer fintech web application
- Purpose: P2P payment request system (like Venmo's Request feature)

## Non-Negotiable Principles

### Financial Data Integrity
- ALL monetary amounts stored as integers (cents). Never use floating-point for money.
- Display format: divide cents by 100, always show exactly 2 decimal places ($XX.XX)
- Amount range: 1 cent ($0.01) minimum, 1,000,000 cents ($10,000.00) maximum

### Security
- Row Level Security (RLS) on every database table
- Users can only read/modify records where they are sender OR recipient
- All mutations server-side (server actions or API routes) — never trust client
- Parameterized queries only — no string interpolation in SQL

### Authentication
- Supabase Auth with email + password
- Session managed via HTTP-only cookies using @supabase/ssr
- Protected routes redirect to /login

### Tech Stack (locked)
- Next.js 14+ (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth)
- Playwright for E2E testing

### Code Quality
- TypeScript strict mode
- No `any` types
- Server components by default, client components only when interactivity needed
- All forms validate both client-side and server-side

### Testing
- E2E tests for all critical user flows
- Playwright with video recording enabled
- Tests must be independent (no shared state between tests)
