# Advisor Handoff Lane Pivots

## Goal

Make routed advisor-attention handoffs more actionable by letting the user pivot across that advisor's other active planner lanes without dropping the scoped LAB context.

## Why Now

- The current roadmap slice is tighter planner polish plus stronger advisor-to-planner routing on top of the canonical task store.
- The task board now preserves advisor scope and handoff context, but a routed user still has to leave the handoff banner and rediscover the preset controls to inspect the advisor's next non-empty lane.
- Adding contextual lane pivots keeps the single-store planner model intact while making the advisor-to-planner sweep feel more intentional.

## What Landed

1. Extended `TaskDashboard` to derive non-empty alternative presets for the current advisor scope when an attention handoff is active.
2. Added compact banner actions so routed users can pivot into those adjacent scoped lanes directly without clearing the advisor handoff.
3. Added focused regression coverage for the routed pivot flow and updated durable repo notes/verification guidance.

## Verification

- `npm run test -- src/components/dashboard/__tests__/TaskDashboard.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`
