# Scoped Advisor Context Lane Pivots

## Goal

Extend the advisor-scoped Weekly LAB context so a user can keep sweeping that advisor's other non-empty planner lanes without first entering from an Attention Radar handoff.

## Why Now

- The current weekly planner already preserves advisor scope for routed handoffs and shows live advisor context when Weekly LAB is narrowed to one advisor.
- That means the remaining friction is local: once the user is already in a scoped advisor view, they still need to leave the context card and hunt through preset buttons to continue sweeping adjacent lanes.
- This is a direct planner-polish extension of the approved advisor-routing slice and keeps the canonical task/planning store as the only state model.

## Plan

1. Derive adjacent non-empty scoped presets for the current advisor context, not just routed attention handoffs.
2. Surface those shortcuts in the scoped advisor context card while preserving the current advisor filter.
3. Add focused regression coverage for the new pivot behavior and rerun the relevant verification commands.

## Notes

- Reuse the existing preset routing helpers instead of introducing new planner state.
- Keep the handoff-specific banner behavior unchanged; this slice only extends the standalone scoped advisor context path.
