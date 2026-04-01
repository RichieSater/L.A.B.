# Attention Card Adjacent Lanes

## Goal

Let planning-focused Attention Radar cards expose their other active scoped planner lanes before the user leaves the Advisors tab.

## Why Now

- The approved roadmap slice is still tighter planner polish plus stronger advisor-action routing on top of the canonical task/planning store.
- Routed task-board handoffs already preserve advisor context after the jump, but planning cards still force the user to open one lane first before discovering the advisor's other active planner work.
- Showing adjacent lanes directly on the planning card improves the advisor-to-planner loop without creating another planner state model.

## Plan

1. Extend the advisor-attention selector contract with alternate scoped planner lanes and lane-specific copy.
2. Render adjacent-lane shortcut buttons on planning cards while keeping the existing primary CTA for the top-ranked lane.
3. Add selector and component regression coverage, then rerun focused and baseline verification.

## Notes

- Keep the weekly planner state canonical; this slice only improves derivation and navigation.
- Avoid the unrelated dirty Compass/calendar/server work already present in the repo.
