# Scoped Advisor Weekly Context

## Goal

Keep advisor-scoped Weekly LAB views connected to the advisor's live next action so opening the weekly task board from an advisor context does not hide whether the domain still needs a session, a quick log, or a planner jump.

## Why Now

- The approved roadmap slice is still planner polish plus tighter advisor-action routing on top of the canonical task/planning store.
- Weekly LAB can already open on an advisor-scoped task view, but once that scope is active the user loses the advisor-level prompt unless the route came from an explicit Attention Radar handoff.
- Reusing the existing advisor-attention derivation inside the scoped weekly view is higher leverage than adding another planner state model or another advisor-only panel.

## Plan

1. Derive the current scoped advisor's live attention item inside `TaskDashboard` whenever the weekly task list is filtered to one advisor.
2. Render a compact scoped-advisor context banner that reuses the existing attention copy and exposes the next non-planning advisor action directly from Weekly LAB.
3. Add focused regression coverage for the scoped banner and direct action flow, then rerun focused plus baseline verification.

## Notes

- Keep all writes inside the existing planner, quick-log, and scheduling boundaries.
- Do not disturb the unrelated dirty Compass/calendar/server work already present in the tree.
