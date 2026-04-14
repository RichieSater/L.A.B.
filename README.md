# The L.A.B.

The L.A.B. is a personal "Life Advisory Board" app. It gives the user a set of domain-specific advisors, tracks shared metrics across them, captures quick daily logs, adds an advisor-attention radar for next-action triage, adds a planning queue plus a daily planning loop for deciding what truly belongs in `today`, surfaces a small weekly-focus layer for objective-setting, folds weekly momentum digests into the weekly review flow, stores short daily and weekly reflections, and supports scheduled sessions with optional Google Calendar sync.

## Critical repo boundary

- The active LAB product repo is `/Users/richiesater/dev/L.A.B/L.A.B.`.
- The only canonical LAB production URL is `https://lab-three-alpha.vercel.app/`.
- The standalone `GoldenCompass` app is decommissioned. LAB is the only live codebase for Golden Compass work.
- The legacy `weekly` repo is not a valid LAB feature or deploy target.
- Preview, claim, temporary, copied-tree, or alternate Vercel deploys are invalid for LAB.
- If the production deploy path is blocked, stop and report the blocker instead of deploying somewhere else.
- Before Compass work, confirm:
  `pwd`
  `git rev-parse --show-toplevel`
  expected root = `/Users/richiesater/dev/L.A.B/L.A.B.`

## Current shape

- Frontend: Vite + React 19 + TypeScript
- Auth: Clerk
- Persistence: Neon Postgres via Drizzle
- Server surface: Vercel-style functions in `api/` backed by shared logic in `server/`
- Core product areas: advisor dashboard, advisor attention radar, task tracking, planning queue, daily planning, weekly focus, weekly review reflections, weekly momentum digests, quick logs, scheduling, Google Calendar connection

## Important directories

- `src/`: client app, routing, state, advisor registry, parser, scheduler, pages, and UI
- `api/`: serverless handlers
- `server/`: persistence, auth, env, Google Calendar integration, and shared HTTP helpers
- `server/db/`: Drizzle schema and database client
- `docs/agent/`: canonical repo harness and verification docs
- `docs/exec-plans/`: active and completed implementation plans

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required values:

```bash
VITE_CLERK_PUBLISHABLE_KEY=...
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=...
LAB_ADMIN_EMAILS=richiesater@gmail.com
```

3. Optional calendar integration variables:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OAUTH_STATE_SECRET=...
APP_URL=http://localhost:5173
```

4. Optional Playwright E2E variables:

```bash
PLAYWRIGHT_TEST_PASSWORD=...
PLAYWRIGHT_TEST_EMAIL=lab-playwright+clerk_test@example.com
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173
```

`PLAYWRIGHT_TEST_PASSWORD` is required for `npm run e2e:provision-user` and `npm run test:e2e`. The Playwright user is a durable Clerk dev account; LAB data can be reset between tests through the existing authenticated reset endpoint instead of deleting the account.

5. Start the client:

```bash
npm run dev
```

## Useful commands

```bash
npm run preflight:lab-root
npm run lint
npm run test
npm run test:guardrails
npm run test:dev-api
npm run build
npm run bundle:check
npm run db:migrate
./deploy.sh
npm run e2e:provision-user
npm run test:e2e
npm run db:generate
```

Deploy LAB only with `./deploy.sh` from the canonical repo root on a clean `main` branch. That script is the only approved LAB deploy path; do not use preview deploy helpers, claim URLs, copied worktrees, or alternate Vercel targets.

Install the browser once before the first local Playwright run:

```bash
npx playwright install chromium
```

## Verification baseline

Before closing substantial work, run:

```bash
npm run preflight:lab-root
npm run test:guardrails
npm run lint
npm run test
npm run build
```

`npm run build` now includes a stable bundle-budget gate for the main entry chunk plus the long-lived `router`, `clerk`, and `react-vendor` bundles. Use `npm run bundle:check` after an existing build if you only want to re-evaluate the emitted asset sizes.

Use `npm run test:guardrails` whenever you touch local bootstrap, `vite.config.ts`, `api/`, `server/`, `vercel.json`, `deploy.sh`, or the auth-to-API boundary. That suite covers the local `/api/*` execution bridge, server-side `.env.local` hydration, and dynamic Vercel API rewrites. `npm run test:dev-api` remains as a compatibility alias to the same guardrail suite.

For architecture, workflows, and repo-specific guardrails, use the harness docs in [`docs/agent/`](docs/agent).
