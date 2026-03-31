# Planning Loop Weekly LAB Routing

## Goal

Extend the daily-planning and weekly-focus cards so advisor-linked tasks can reopen the matching advisor-scoped Weekly LAB lane instead of forcing the user to mentally jump back into the raw task list.

## Why Now

- The roadmap's current approved slice is still planner polish plus stronger advisor-action routing on top of the canonical task/planning model.
- Weekly review, recent activity, advisor detail, and strategic goal rows already reuse Weekly LAB routing, but the daily-planning and weekly-focus cards still strand the user in local card actions.
- This can land in clean dashboard files without disturbing the broader in-flight Compass/calendar/server work already present in the tree.

## Plan

1. Add a shared dashboard helper that derives the canonical Weekly LAB route for an open task using the existing priority order: `needs_triage`, `carry_over`, `overdue`, then `weekly_focus`.
2. Surface route buttons from daily-planning action cards and weekly-focus cards only when a task actually maps to one of those canonical lanes.
3. Wire the callbacks through `TaskDashboard` so the shortcuts apply the existing advisor-scoped preset behavior instead of creating new filter state.
4. Add focused component coverage plus `TaskDashboard` integration coverage, then rerun lint/test/build and refresh repo notes for the new routing behavior.
