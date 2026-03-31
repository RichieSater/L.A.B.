# Attention Handoff Context

## Goal

Keep advisor-attention routing intentional by showing why the weekly task board opened on a scoped planner lane and giving the user an obvious way to expand back to the full LAB.

## Why Now

- The current roadmap slice is tighter planner polish plus stronger advisor-to-planner routing on top of the canonical task store.
- Advisor-attention cards already route into the correct scoped planner lane, but the weekly task board still drops the explanation once the handoff lands.
- Adding routed context improves the advisor-to-planner loop without adding new persistence or another planner state model.

## What Landed

1. Extended task-board navigation requests with optional attention-radar context instead of inventing a second planner state model.
2. Passed advisor-attention headline, reason, and scoped lane counts through the existing dashboard handoff path.
3. Added a task-board handoff banner that keeps the routed advisor context visible and lets the user expand back to all advisors while preserving the active preset.
4. Added regression coverage for the richer handoff contract and reran the repo verification baseline.

## Verification

- `npm run test -- src/components/dashboard/__tests__/AdvisorAttentionPanel.test.tsx src/components/dashboard/__tests__/TaskDashboard.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`
