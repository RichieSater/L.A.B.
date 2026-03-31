# Recent Activity Planner Routing

## Goal

Let advisor-linked Recent Activity entries reopen that advisor's current highest-signal Weekly LAB lane so the review timeline can flow directly back into the canonical planner.

## Why Now

- The approved roadmap slice is still planner polish plus stronger advisor-action and review surfaces on top of the canonical task/planning store.
- Recent Activity now reflects scoped advisor momentum, but it still behaves like a passive feed even when the same advisor already has a clear next planner lane.
- Reusing the existing planner-lane derivation keeps the weekly task model canonical instead of creating a new review-only action system.

## Plan

1. Extend the recent-activity selector contract with an optional recommended advisor planner shortcut derived from the current open-task pressure for that advisor.
2. Render a direct Weekly LAB CTA on advisor-linked timeline items when that advisor has a non-empty recommended lane.
3. Wire the CTA through the existing `TaskDashboard` preset/scope contract and cover the selector, timeline component, and dashboard integration with regression tests.

## Notes

- Keep ritual-only timeline items passive; only advisor-linked activity should route into scoped planner lanes.
- Avoid the unrelated dirty Compass/calendar/server work already present in the repo.
