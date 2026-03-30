# Dev API Bootstrap Regression

## Problem

- `npm run dev` currently starts only the Vite client server.
- Because the repo keeps Vercel-style handlers under `api/`, requests like `/api/bootstrap` are being served by Vite as transformed source modules instead of executed as API handlers.
- The auth bootstrap path expects JSON, so the client crashes with `Unexpected token 'i', "import __v"... is not valid JSON`.

## Plan

1. Add a Vite dev-only API bridge that intercepts `/api/*` before static file serving and dispatches to the matching handler in `api/`.
2. Support the request/response surface this repo already uses: method, headers, query params, JSON body parsing, status/json/send helpers, and redirect handling.
3. Cover the route-resolution behavior with tests so dynamic handlers like `/api/scheduled-sessions/:id` do not regress.
4. Add deeper guardrails that would have caught both failures:
   - a dev-server regression test that proves `/api/bootstrap` is executed as JSON instead of served as JavaScript;
   - a config regression test that proves non-`VITE_` env vars from `.env.local` are loaded into the server-side process for local API execution.
5. Add repo-specific Codex skills so future work touching Vite, auth bootstrap, `api/`, or Clerk env loading follows the same validation path by default.
6. Re-run the repo verification baseline with special attention to local bootstrap behavior.

## Verification

- `curl /api/bootstrap` from Vite dev should no longer return JavaScript source.
- `npm run test:dev-api`
- `npm run lint`
- `npm run test`
- `npm run build`
