# Strategic Dashboard Regression Fix

## Goal

Restore the shared strategic-dashboard and Compass type/action surface so the weekly planner and advisor detail views compile, render, and route against one coherent `AppState` model again.

## Why Now

- The current automation run confirmed broad verification is red before any new roadmap slice can start.
- `npm run build` and `npm run test` both fail on the same regression: strategic UI components reference `strategicDashboard`, strategic reducer actions, and Compass session types that no longer exist in shared state/types.
- Fixing this regression is required before the automation can resume feature work.

## Plan

1. Reintroduce the missing strategic-dashboard and Compass type modules with helpers for default year/state creation.
2. Extend `AppState`, init helpers, app actions, reducer logic, and the API client so the strategic planner surface has a complete compile-time contract again.
3. Keep the implementation inside the existing canonical task/planning model by reusing current task bucket and weekly-focus behavior when strategic goals promote into work.
4. Re-run targeted strategic tests, then the broad verification set (`lint`, `test`, `build`, `harness validate .`) before closing the run.
