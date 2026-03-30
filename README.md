# The L.A.B.

The L.A.B. is a personal "Life Advisory Board" app. It gives the user a set of domain-specific advisors, tracks shared metrics across them, captures quick daily logs, and supports scheduled sessions with optional Google Calendar sync.

## Current shape

- Frontend: Vite + React 19 + TypeScript
- Auth: Clerk
- Persistence: Neon Postgres via Drizzle
- Server surface: Vercel-style functions in `api/` backed by shared logic in `server/`
- Core product areas: advisor dashboard, task tracking, quick logs, scheduling, Google Calendar connection

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
```

3. Optional calendar integration variables:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OAUTH_STATE_SECRET=...
APP_URL=http://localhost:5173
```

4. Start the client:

```bash
npm run dev
```

## Useful commands

```bash
npm run lint
npm run test
npm run build
npm run bundle:check
npm run db:generate
npm run db:migrate
```

## Verification baseline

Before closing substantial work, run:

```bash
npm run lint
npm run test
npm run build
```

`npm run build` now includes a stable bundle-budget gate for the main entry chunk plus the long-lived `router`, `clerk`, and `react-vendor` bundles. Use `npm run bundle:check` after an existing build if you only want to re-evaluate the emitted asset sizes.

For architecture, workflows, and repo-specific guardrails, use the harness docs in [`docs/agent/`](docs/agent).
