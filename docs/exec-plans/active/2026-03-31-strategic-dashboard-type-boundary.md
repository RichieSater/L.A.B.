# Strategic Dashboard Type Boundary

## Goal

Fix the current compile regression by restoring the missing shared type and reducer surface that the landed strategic planner UI already expects.

## Why Now

- `npm run build` is red on missing `strategic-dashboard` / `compass` types, missing `AppState.strategicDashboard`, missing strategic action variants, and the absent `apiClient.listCompassSessions()` signature.
- Automation rules require fixing the top verified regression before starting another feature extension.
- This is boundary repair, not new product scope: the strategic planner, advisor detail hooks, and tests already reference these shapes.

## Plan

1. Add the missing strategic-dashboard and compass type modules and export them through the shared type barrel.
2. Extend `AppState`, init defaults, action unions, and reducer handling so the strategic planner dispatches against a real state model.
3. Add the missing API client signature and supporting response types needed for compilation.
4. Re-run build, tests, lint, and harness validation to confirm the regression is closed.

## Verification

- Verified on 2026-03-31 with `npm run build`, `npm run test`, `npm run lint`, and `harness validate .`.
