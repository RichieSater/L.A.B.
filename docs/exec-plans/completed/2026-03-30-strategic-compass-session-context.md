# Strategic Compass Session Context

## Goal

Keep the weekly-first strategic planner tied to the live Compass workflow by surfacing the current in-progress session and offering a direct resume path.

## Why Now

- The unified LAB roadmap now depends on Compass and strategy living inside the same shell, but the strategic planner still only exposes a generic `Open Compass` jump.
- Once a Compass session exists, the highest-leverage action is usually resuming the active exercise, not re-opening the session list and re-deciding what to do.
- This is a planner-polish slice that strengthens the Compass-to-strategy loop without adding another persistence model.

## Plan

1. Load recent Compass sessions inside the strategic planner and derive the most relevant session context.
2. Show a compact status callout for the active in-progress session when one exists, including resume metadata.
3. Change the primary CTA to resume the active session directly, while keeping a library fallback to `/compass`.
4. Add regression coverage for the resume path and rerun the relevant verification commands.
