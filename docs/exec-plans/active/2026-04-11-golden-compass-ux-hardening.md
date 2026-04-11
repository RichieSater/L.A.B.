# Golden Compass UX Hardening And Regression Coverage

## Goal

Fix Golden Compass text-entry regressions at the source, harden the full in-app Compass flow, and add dedicated automated coverage for the main Compass entry and resume paths.

## Why Now

- The Bonfire multi-input field currently loses stability while typing because its row key includes live input text.
- The Past-months Compass screen still makes the user type month names by hand instead of carrying a stable, session-anchored read-only month window with a simple include-current-month toggle.
- Compass has server persistence and planner resume affordances now, but the current automated coverage does not exercise the actual session runner UX where typing, autosave, save-and-exit, and completion happen.
- This slice should stay tightly focused on Golden Compass and its core entry points instead of reopening unrelated LAB surfaces or harness maintenance.

## Plan

1. Replace the value-derived multi-input row identity with stable local row ids while keeping persisted Compass answers as plain string arrays.
2. Convert the Past-months step into a read-only month list derived from session `createdAt`, defaulting to the agreed `> 10` include-current-month rule and persisting only a single `includeCurrentMonth` toggle choice with legacy month-answer inference for older sessions.
3. Add focused Compass runner tests for required-field gating, input hydration across all interactive screen types, the read-only month toggle flow, save-and-exit flush behavior, and completion.
4. Add dashboard and session-page tests for Compass create/open, grouped session states, load failures, and 404 redirect behavior.
5. Add a dedicated Playwright Golden Compass regression that starts from the live app entry path, creates a session, validates uninterrupted multi-word typing, save-and-exit, planner resume, and full completion on desktop and mobile.
6. Verify with lint, unit/integration tests, build, and the targeted Playwright Compass flow.
