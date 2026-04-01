# Golden Compass Recovery And LAB Integration

## Goal

Restore Golden Compass as a real LAB feature by mounting it in the app, giving it a first-class dashboard tab, persisting Compass sessions on the server, and wiring completion back into LAB's strategic layer and advisor prompts.

## Why Now

- LAB already documents Compass as part of the product surface, but the current app only has dead Compass routes and summary-only types.
- The strategic planner and advisor detail surfaces already point users toward `/compass`, so the missing route and persistence boundary create a broken product promise.
- This slice keeps the unified LAB architecture intact by making Compass server-owned and writing back into the existing strategic dashboard instead of reviving the old split-app model.

## Plan

1. Add a dedicated Compass session persistence boundary plus API handlers for create, list, read, autosave, and completion.
2. Expand shared Compass and strategic-dashboard types so client, server, and tests use the same session, insight, and goal-seeding contract.
3. Add a real Compass tab and Compass session route in LAB, plus a LAB-native Compass library and runner with autosave, resume, save-and-exit, and completion.
4. Reuse Compass completion to update `latestCompassInsights`, seed current-year `yearGoals` only when that year has not been manually edited, and expose those strategic signals in advisor prompts.
5. Cover the new behavior with server, reducer, prompt, and dashboard/advisor regression tests, then rerun guardrails, lint, test, build, and harness refresh/validate.

## Notes

- Keep the Compass list surface inside the LAB shell; `/compass` is a deep-link alias, not a separate standalone app.
- Port a LAB-first subset of the legacy Compass flow: keep the core questionnaire and shared answer ids, but skip animation-heavy polish and PDF export.
- Do not introduce a second long-term-goal system; Compass should seed and enrich the existing strategic dashboard only.
