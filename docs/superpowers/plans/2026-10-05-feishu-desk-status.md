# Feishu Desk Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Execute this plan task-by-task with tests and review gates.

**Goal:** Build and deploy a private-source web status display that derives four desk states from Eason's Feishu calendar.

**Architecture:** A Next.js application renders the display and exposes server routes for Feishu OAuth and the derived status. The user's calendar token is stored only inside an encrypted secure cookie; the browser receives only the status, end time, and freshness timestamp.

**Tech Stack:** Next.js, TypeScript, Vitest, Vercel, Feishu Calendar OpenAPI

## Global Constraints

- Timezone: Europe/London.
- Working hours: Monday–Friday, 09:00–21:00.
- Lunch: 12:30–13:30.
- Calendar refresh: every 60 seconds.
- Do not expose calendar titles, descriptions, attendees, links, or tokens.
- Ignore cancelled, declined, unaccepted, free, all-day, and configured placeholder events.

---

### Task 1: Application shell and deterministic status engine

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`
- Create: `lib/status.ts`, `lib/status.test.ts`

**Interfaces:**
- Produces: `deriveStatus(input: StatusInput): DeskStatus`

- [ ] Scaffold a minimal Next.js TypeScript application with Vitest.
- [ ] Write tests covering meeting, lunch, work, off-work, RSVP filtering, placeholders, and overlapping meetings.
- [ ] Implement the pure status engine until all tests pass.
- [ ] Commit the working status engine.

### Task 2: Secure Feishu OAuth and calendar client

**Files:**
- Create: `lib/session.ts`, `lib/feishu.ts`
- Create: `app/api/auth/login/route.ts`, `app/api/auth/callback/route.ts`
- Create: `app/api/status/route.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `sealSession`, `openSession`, `exchangeCode`, `refreshAccessToken`, `listEvents`.
- Status endpoint returns `{status, until, refreshedAt}` or HTTP 401 with `{reconnect:true}`.

- [ ] Implement AES-256-GCM cookie encryption using Web Crypto.
- [ ] Implement Feishu authorization-code exchange and refresh-token rotation.
- [ ] Implement calendar retrieval for the current London day.
- [ ] Map calendar payloads to the minimal fields consumed by `deriveStatus`.
- [ ] Ensure no sensitive calendar fields appear in endpoint responses or logs.
- [ ] Commit OAuth and calendar integration.

### Task 3: Full-screen desk display

**Files:**
- Modify: `app/page.tsx`
- Create: `app/globals.css`, `components/status-display.tsx`

**Interfaces:**
- Consumes: `/api/status`.
- Produces: full-screen UI with four distinct states and a reconnect screen.

- [ ] Implement a high-contrast responsive display suited to phone, tablet, and e-ink browsers.
- [ ] Poll `/api/status` every 60 seconds and switch at known `until` boundaries.
- [ ] Cache the last successful state and show a subtle stale indicator on transient failures.
- [ ] Verify no meeting details are rendered.
- [ ] Commit the display.

### Task 4: Verification and deployment

**Files:**
- Create: `README.md`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- GitHub repository: `easontian714/feishu-desk-status`.
- Production host: Vercel.

- [ ] Run unit tests, type checking, linting, and production build.
- [ ] Create a private GitHub repository and push the main branch.
- [ ] Import the repository into Vercel and configure secrets.
- [ ] Add the production OAuth redirect URL to the Feishu app configuration.
- [ ] Complete one production OAuth login and verify all four fallback/meeting states.
- [ ] Document the production URL and configuration in README.
- [ ] Commit any deployment fixes and push them.
