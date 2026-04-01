# Weekly Recap From Activity

## Goal

Add a deterministic weekly recap to the existing weekly review surface so the user can compress recent momentum and unfinished pressure into a useful next-week readout without introducing a new persistence model.

## Checklist

- Extend the weekly review selector with a recap payload derived from the current week's recent wins, advisor momentum, planner pressure, and existing action groups.
- Render the recap inside `WeeklyReviewCard` using the existing review surface rather than a separate dashboard module.
- Keep the first pass deterministic and local-state-derived; do not add AI prose generation or new saved fields.
- Add regression coverage for selector derivation and card rendering.
- Update durable harness docs and archive this plan once verification passes.
