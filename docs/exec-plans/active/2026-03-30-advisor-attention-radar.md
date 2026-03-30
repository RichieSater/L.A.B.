# Advisor Attention Radar

## Goal

Add an advisors-tab surface that makes the next meaningful action obvious for each active advisor instead of forcing the user to inspect every card and mentally triage the whole board.

## Why Now

- The repo already has a stronger task-planning stack, weekly focus, and weekly review flow, but the advisors tab still mostly shows status at a glance rather than a concrete "do this next" suggestion.
- Recent external planning discussions repeatedly stress the same product requirement: reduce friction, reduce decisions, and surface the next action instead of making the user manage admin about admin.
- This feature fits the L.A.B. product shape better than another generic task list tweak because it uses advisor-specific cadence, quick-log recency, and backlog state together.

## Plan

1. Add a derived advisor-attention selector that combines cadence urgency, overdue or unplanned task pressure, and quick-log recency into a ranked "next action" summary.
2. Render that summary above the advisor grid so the advisors tab shows which domains need a session, a quick log, or task triage right now.
3. Reuse existing actions instead of inventing a new workflow: schedule through the current schedule modal, quick-log through the current quick-log modal, and planning through the existing tasks tab.
4. Cover the selector and panel behavior with targeted tests, then rerun the relevant repo verification commands.

## Notes

- Keep the first pass client-derived. Do not introduce new persistence for this feature.
- Preserve the current dark visual language and avoid turning the advisors tab into a second copy of the task dashboard.
