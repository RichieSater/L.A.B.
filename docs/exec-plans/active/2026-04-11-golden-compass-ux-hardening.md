# Golden Compass UX Hardening And Regression Coverage

## Goal

Fix Golden Compass text-entry regressions at the source, harden the full in-app Compass flow, and add dedicated automated coverage for the main Compass entry and resume paths.

## Why Now

- The Bonfire multi-input field currently loses stability while typing because its row key includes live input text.
- Compass has server persistence and planner resume affordances now, but the current automated coverage does not exercise the actual session runner UX where typing, autosave, save-and-exit, and completion happen.
- This slice should stay tightly focused on Golden Compass and its core entry points instead of reopening unrelated LAB surfaces or harness maintenance.

## Plan

1. Replace the value-derived multi-input row identity with stable local row ids while keeping persisted Compass answers as plain string arrays.
2. Add focused Compass runner tests for required-field gating, input hydration across all interactive screen types, save-and-exit flush behavior, and completion.
3. Add dashboard and session-page tests for Compass create/open, grouped session states, load failures, and 404 redirect behavior.
4. Add a dedicated Playwright Golden Compass regression that starts from the live app entry path, creates a session, validates uninterrupted multi-word typing, save-and-exit, planner resume, and full completion on desktop and mobile.
5. Verify with lint, unit/integration tests, build, and the targeted Playwright Compass flow.
