# Weekly Review Advisor Routing

## Goal

Turn the Weekly Review "Advisor Signals" surface into an actionable advisor-to-planner handoff instead of a read-only status summary.

## Why Now

- The approved roadmap slice is still tighter planner polish plus stronger advisor-action and review surfaces on top of the canonical task/planning store.
- Weekly Review already tells the user which advisors generated momentum or still need attention, but it did not let them act on that signal without manually rebuilding the right Weekly LAB scope.
- Reusing the existing advisor-scoped preset vocabulary is higher leverage than adding another review panel or another planner state model.

## What Landed

1. `selectWeeklyReviewSummary` now derives one recommended planner target per advisor snapshot, reusing the same advisor-scoped lane priority used elsewhere in Weekly LAB and falling back to the advisor's scoped open task list when no special lane is active.
2. `WeeklyReviewCard` now renders a single CTA on advisor-signal cards so the review surface can jump straight into the relevant advisor-scoped Weekly LAB lane instead of staying read-only.
3. `TaskDashboard` now applies that review CTA through the existing preset/filter reset contract, and focused regression coverage was added for both the review card and dashboard integration.

## Verification

- `npm run test -- src/components/dashboard/__tests__/WeeklyReviewCard.test.tsx`
- `npm run test -- src/components/dashboard/__tests__/TaskDashboard.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`

## Notes

- Keep the canonical task/planning model as the only state model; this slice is navigation and derivation only.
- Do not disturb the unrelated dirty Compass/calendar/server files already present in the repo.
