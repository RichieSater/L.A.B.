# Advisor-Scoped Recent Activity

## Goal

Keep the Recent Activity review surface aligned with the current Weekly LAB scope so an advisor-scoped planner view also shows that advisor's recent momentum instead of a global mixed feed.

## Why Now

- The current approved roadmap slice is planner polish plus stronger advisor-action and review surfaces on top of the canonical task/planning store.
- Weekly LAB already preserves advisor scope in the task list, handoff banner, and scoped advisor context card, but the recent-activity timeline still breaks that context by showing unrelated advisors.
- Tightening this derivation boundary is higher leverage than another new card because it makes the existing review surface actually support advisor-by-advisor sweeps.

## Plan

1. Add optional advisor scoping to the recent-activity selector and exclude unrelated activity when Weekly LAB is narrowed to one advisor.
2. Update the timeline copy so the current scope is explicit in the advisor-scoped view.
3. Add regression coverage for the scoped timeline behavior and rerun focused plus baseline verification.

## Notes

- Keep the activity feed derived from the existing canonical task/session/log/review sources.
- Do not add new persistence or a second review model for advisor-specific history.
