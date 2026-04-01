# Strategic Linked Task Routing

## Goal

Let linked strategic goals reopen the canonical Weekly LAB lane for their current task state so strategy rows can hand off directly into execution without another browse step.

## Why Now

- The approved roadmap slice is still tighter planner polish plus stronger advisor-action routing on top of the canonical task/planning store.
- Strategic goal rows already reuse canonical tasks for promotion and bucket changes, but they still strand the user inside the strategy strip when they need to inspect or continue the linked work in Weekly LAB.
- Reusing the existing advisor-scoped Weekly LAB routing contract keeps strategy and execution aligned without adding another planner state model.

## Plan

1. Derive the current Weekly LAB route for each open linked task using the same canonical priority order already used elsewhere: `needs_triage`, then `carry_over`, then `overdue`, then `weekly_focus`.
2. Expose a direct CTA in linked-task controls that opens the advisor-scoped Weekly LAB on that lane, with a scoped task-list fallback when no special lane is active.
3. Add regression coverage for the new routing behavior, then rerun focused and baseline verification.

## Notes

- Keep routing inside the existing dashboard navigation state; do not add another strategy-only execution surface.
- Do not disturb the unrelated dirty Compass/calendar/server work already present in the repo.
