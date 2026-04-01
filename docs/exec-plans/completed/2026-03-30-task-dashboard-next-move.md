# Task Dashboard Next Move

## Goal

Tighten the weekly-first planner shell by surfacing a single recommended next move that jumps the raw task list into the highest-signal preset.

## Why Now

- The weekly planner already has useful preset filters, but the user still has to decide which lane matters most before acting.
- The roadmap's current `Now` slice is planner polish on top of the canonical task model, not new persistence or another workflow surface.
- A derived recommendation can reuse the current preset counts and filter resets without adding a second planner state model.

## Plan

1. Derive one recommended preset from existing planner signals with stable priority ordering.
2. Render a compact callout above the task list that explains why that lane is the next move and jumps into the matching preset.
3. Keep the recommendation purely derived from the same canonical task, planning, review, and weekly-focus data already shown elsewhere.
4. Add regression coverage for the recommendation priority and CTA behavior, then rerun the relevant verification commands.

## Acceptance Criteria

- The planner shows a single recommended next move when a higher-signal preset exists beyond `All Open`.
- The CTA applies the same preset/filter behavior as the existing task-list preset buttons.
- When no higher-signal lane exists, the planner stays on the neutral `All Open` framing instead of inventing synthetic urgency.
