# Attention Panel Planner Shortcuts

## Goal

Deepen the advisor-to-planner loop by letting non-planning attention cards open their already-derived canonical planner lane without replacing their primary action.

## Why Now

- The roadmap's active slice is tighter planner polish plus stronger advisor-action routing on top of the canonical task/planning store.
- `AdvisorAttentionPanel` already receives `planningPreset`, `planningLabel`, and `planningCount` for every advisor card, but only cards whose primary action is `plan` were using that routing.
- Schedule or quick-log nudges can still carry real queue pressure, so the panel should expose that lane directly instead of forcing the user to leave the attention context.

## What Landed

1. Added a secondary planner-lane shortcut to attention cards when they already have a derived planner target but a different primary action.
2. Reused the existing dashboard task-routing contract and attention handoff context instead of adding new planner state.
3. Added focused panel coverage for the new shortcut behavior and reran the repo verification baseline.

## Verification

- `npm run test -- src/components/dashboard/__tests__/AdvisorAttentionPanel.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`
