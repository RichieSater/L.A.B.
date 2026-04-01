# Advisor Detail Task Row Lanes

## Goal

Let advisor-detail task rows jump straight into the matching advisor-scoped Weekly LAB lane so item-level task cleanup can flow into the canonical planner without a second browse step.

## Why Now

- The roadmap's active slice is still planner polish plus tighter advisor-action routing on top of the canonical task/planning store.
- Advisor detail already exposes planner routing at the summary-card level, but the task rows themselves still strand the user inside the detail page after they identify a specific item that belongs in `needs_triage`, `carry_over`, `overdue`, or `weekly_focus`.
- This is a small interaction extension that reuses the existing dashboard navigation contract instead of introducing any new planner state.

## Plan

1. Derive the highest-signal Weekly LAB lane for each advisor-detail task row using the same preset vocabulary and priority order already used elsewhere.
2. Expose a row-level CTA that opens the advisor-scoped Weekly LAB on that lane while keeping the existing inline planning and focus actions intact.
3. Extend advisor-detail regression coverage for row-level Weekly LAB routing, then rerun focused and baseline verification.

## Notes

- Keep routing local to the current advisor scope; do not create a second task dashboard state model.
- Work on top of the existing dirty advisor-detail task-row changes without reverting them.
