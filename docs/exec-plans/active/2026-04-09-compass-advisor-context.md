# Compass Advisor Context

## Goal

Expose the right Golden Compass answers inside advisor prompts so every advisor can see the latest completed Compass context, not just the distilled annual-goal / ritual / support summary.

## Why Now

- Advisors currently only receive `latestCompassInsights`, which leaves out the fuller `The Past` and `The Perfect Day` writing the user explicitly wants advisors to consider.
- The Compass persistence boundary already lives on the server and already feeds strategic state, so this can extend the existing single-store architecture instead of adding a second prompt-only fetch path.
- Existing users may already have completed Compass sessions, so the change needs a bootstrap backfill path instead of requiring a fresh completion event.

## Plan

1. Add shared Compass advisor-context types plus an extractor that maps raw completed-session answers into trimmed `The Past` and `The Perfect Day` prompt context.
2. Extend `StrategicDashboardState` with persisted `latestCompassAdvisorContext`, set it on Compass completion, and lazily backfill it during bootstrap from the most recent completed session when absent.
3. Add a new prompt section after `[STRATEGIC CONTEXT]` so all advisors receive the latest completed Compass context while keeping drafts private.
4. Cover extraction, persistence/backfill, and prompt rendering with targeted regression tests, then run guardrails, lint, test, build, and harness refresh/validate.

## Notes

- Use the latest completed Compass session only; do not expose in-progress answers.
- Preserve the user’s wording in prompts, trimming only when fields get too long for practical prompt size.
- Keep the existing goal-seeding rule unchanged: Compass may still seed `yearGoals` only when that year has not been manually edited.
