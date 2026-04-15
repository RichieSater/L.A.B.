# Buffered Persistence for Compass and Planner Typing

## Goal

Stop LAB from persisting on nearly every typing pause by buffering local drafts first and only committing text-entry changes after blur, explicit navigation, or a longer idle window.

## Why Now

- Golden Compass text-entry screens can currently emit a stream of session PATCH requests while the user is still typing.
- Weekly LAB note fields currently dispatch into app state on each keystroke, which feeds the global autosave loop far too aggressively.
- The user-visible result is repeated loading churn and unstable-feeling input across Compass and planner surfaces.

## Plan

1. Add a shared buffered-commit hook for dirty local drafts with idle-save fallback, blur flush, explicit flush, external-value reset, and duplicate-commit suppression.
2. Refactor Compass typing flows to keep answer edits local first, then persist only on blur, add/remove item actions, or explicit session navigation actions.
3. Refactor Weekly LAB text-entry fields in the strategic planner, daily planning card, and weekly review card so they stage local drafts and only dispatch after blur or idle.
4. Keep discrete click actions, scheduling actions, checklist toggles, and planner bucket moves on the current immediate action path.
5. Add unit, component, and Playwright coverage that verifies buffered persistence and bounded request counts instead of save-on-every-pause churn.
