# Clerk Playwright Test User

## Goal

Make Playwright browser tests authenticate through the real Clerk dev instance without any manual login flow.

## Plan

1. Add Playwright plus Clerk's official Playwright testing helpers and expose repo-native E2E scripts.
2. Provision a durable Clerk test user idempotently with a password-based sign-in path.
3. Save authenticated Clerk storage state in a setup project, then reuse it across browser tests.
4. Add shared authenticated and clean-state Playwright fixtures so tests can either keep durable state or clear LAB data through the existing reset endpoint.
5. Add GitHub Actions coverage for guardrails, build/test, and the new authenticated Playwright flow.

## Verification

- `npm run test:dev-api`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
