# Advisor Attention Alternate Planner Lanes

## Goal

Extend the advisor attention radar so schedule-first and quick-log-first cards can still expose other live Weekly LAB lanes when queue pressure exists for the same advisor.

## Why Now

- The approved roadmap slice is still planner polish plus stronger advisor-action routing on top of the canonical task model.
- Planning-first radar cards already show adjacent lane shortcuts, but schedule and quick-log cards still collapse planner follow-up into a single fallback button even when multiple scoped lanes are active.
- This is a contained extension of the existing selector contract and navigation flow, so it improves leverage without reopening the broader in-flight Compass or calendar work.

## Plan

1. Reuse the existing `alternatePlanningShortcuts` contract in `AdvisorAttentionPanel` for non-plan cards instead of limiting those shortcuts to planning-primary cards.
2. Keep the current primary action behavior intact while exposing additional scoped Weekly LAB shortcuts with lane-specific copy.
3. Cover the non-plan alternate-lane interaction with targeted radar tests, then rerun focused and baseline verification.

## Notes

- Do not introduce new planner state or new selector derivation for this slice.
- Leave the unrelated dirty Compass/calendar/server/dashboard worktree changes untouched.
