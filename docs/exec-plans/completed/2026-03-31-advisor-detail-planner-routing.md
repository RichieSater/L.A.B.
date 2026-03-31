# Advisor Detail Planner Routing

## Goal

Let the advisor detail page open the weekly LAB on the most relevant advisor-scoped planner lane instead of only linking back to the generic dashboard shell.

## Why Now

- The approved roadmap slice is still planner polish plus tighter advisor-action routing on top of the canonical task/planning store.
- Advisor detail already derives domain-specific planning context, but its current CTA drops that context and forces the user to rediscover the right lane after leaving the page.
- Reusing the existing dashboard navigation contract is higher leverage than adding another advisor-specific planner UI.

## What Landed

1. Extended the advisor detail planning context to derive the same advisor-scoped planner-lane priority used by the weekly task board: `needs_triage`, then `carry_over`, then `overdue`, then `weekly_focus`.
2. Routed the primary CTA into the weekly LAB with `dashboard.taskList` state scoped to the advisor and recommended preset, while keeping adjacent non-empty lanes available as secondary shortcuts.
3. Added focused regression coverage for the routed navigation and updated durable repo notes plus verification guidance.

## Verification

- `npm run test -- src/components/advisor-detail/__tests__/AdvisorDetail.test.tsx`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`
