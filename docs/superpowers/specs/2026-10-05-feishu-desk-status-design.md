# Feishu Desk Status — Design

## Goal

Provide a permanent web page that can be displayed on a phone, tablet, or e-ink browser at a desk. It reads Eason's Feishu calendar and shows one of four states:

- 在上班
- 开会中 · HH:mm 结束
- 吃饭中 · HH:mm 回来
- 下班了

The page must not expose meeting titles, participants, descriptions, or calendar links.

## Status rules

Evaluation timezone is Europe/London.

1. An accepted, busy calendar event covering the current time → 开会中.
2. Otherwise, during the configured lunch window → 吃饭中.
3. Otherwise, during configured working hours on Monday–Friday → 在上班.
4. Otherwise → 下班了.

Cancelled events, declined invitations, unaccepted invitations, all-day events, free events, and configured placeholder events are ignored. If accepted meetings overlap, the latest end time is displayed.

Initial configuration:

- Working hours: Monday–Friday, 09:00–21:00
- Lunch: 12:30–13:30
- Calendar refresh: every 60 seconds

## Architecture

- Next.js web application stored in a private GitHub repository.
- Vercel hosts the page and server-side calendar API routes.
- Feishu OAuth is used to grant calendar read-only access.
- Tokens are encrypted into an HTTP-only, secure cookie. No Feishu token is committed to GitHub or exposed to browser JavaScript.
- The browser requests only the derived state and end time from the backend.

## User flow

1. Open the deployed URL.
2. If authorization is absent or expired, sign in with Feishu.
3. Leave the page open in full-screen mode.
4. The status refreshes once per minute and switches locally at known meeting boundaries.

## Error handling

- Calendar temporarily unavailable: continue showing the last successful state with a subtle stale-data indicator.
- Authorization expired or revoked: show a reconnect action.
- No qualifying events: use working-hours and lunch rules.

## Deployment

- Private GitHub repository: easontian714/feishu-desk-status.
- Vercel production deployment.
- Required secrets are configured only in Vercel environment variables.
- Feishu OAuth redirect URL is configured after Vercel provides the production domain.

## MVP exclusions

- Feishu presence/online-state integration.
- Manual status override.
- Multiple users.
- Hardware control or native e-ink application.
- Displaying meeting details.
