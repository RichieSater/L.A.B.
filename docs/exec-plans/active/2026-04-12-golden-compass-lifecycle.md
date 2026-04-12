# Golden Compass Lifecycle

## Goal

Add explicit Golden Compass lifecycle management so LAB can keep one active completed Compass for advisor and summary context, let users mark completed Compasses as achieved, and safely delete old Compass history without disturbing existing strategic rows or linked tasks.

## Why Now

- LAB currently treats the most recent completed Compass as both history and the globally active source of Compass context, which prevents users from intentionally reusing an older Compass.
- Advisors and summary surfaces read cached `latestCompass*` fields from strategic state, so manual selection, achieved state, and deletion need a single reconciliation path instead of ad hoc UI logic.
- Users need to distinguish “completed in app” from “achieved in life,” and that distinction should stay visible to advisors at a high level without replacing the full active Compass context.

## Plan

1. Extend shared Compass and strategic-dashboard types with `achievedAt`, `isActive`, `activeCompassSessionId`, and high-level achieved Compass summaries.
2. Add DB and server lifecycle support for achieved state, active Compass reconciliation, delete behavior, bootstrap backfill, and API responses that expose active/achieved status.
3. Update Compass session APIs and client helpers to support `setActive`, `achieved`, and delete actions.
4. Refresh Compass library and strategic planner UI so completed history can be activated, achieved, or deleted while preserving in-progress behavior and clear fallback copy.
5. Add advisor prompt wiring for high-level achieved Compass history while keeping full raw Compass context scoped to the active Compass only.
6. Cover the lifecycle with targeted server, API, prompt, and dashboard tests.
