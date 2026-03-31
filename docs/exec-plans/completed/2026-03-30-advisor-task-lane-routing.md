# Advisor Task-Lane Routing

## Goal

Make advisor-originated planner actions open the correct weekly LAB lane instead of dumping the user into a generic task board.

## Why Now

- The weekly-first dashboard and advisor attention radar are already landed, but advisor-to-planner routing still stopped one step short of the real next action.
- The roadmap explicitly called for tighter planner polish and stronger advisor action routing on top of the single canonical task store.
- This slice improves decision reduction without adding a second planner model or any new persistence.

## What Landed

1. Added a lightweight dashboard navigation contract for scoped weekly task-board requests.
2. Taught the weekly task board to consume a routed preset plus advisor scope while reusing the existing preset/filter model.
3. Routed attention-radar planning nudges into the most relevant weekly LAB lane for that advisor.
4. Added focused UI regression coverage for routed presets and advisor-scoped task-lane handoff.

## Verification

- `npm run test -- src/components/dashboard/__tests__/AdvisorAttentionPanel.test.tsx src/components/dashboard/__tests__/TaskDashboard.test.tsx`
- `npm run lint`
- `npm run build`
