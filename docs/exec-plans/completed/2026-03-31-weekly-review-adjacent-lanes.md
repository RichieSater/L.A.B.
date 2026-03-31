# Weekly Review Adjacent Lanes

## Goal

Let Weekly Review advisor-signal cards pivot into other non-empty scoped planner lanes so the review surface can keep sweeping the same advisor without dropping back to generic task browsing.

## Why Now

- The current weekly-review advisor cards only open one recommended lane even when the same advisor has other active queue pressure.
- Recent planner polish already added adjacent lane pivots to Attention Radar and scoped weekly-LAB context; Weekly Review should offer the same continuity on its own review surface.
- This extends the approved advisor-to-planner loop without creating new planning state because every action still routes into the existing canonical presets.

## Plan

1. Extend the weekly-review advisor snapshot selector with alternate non-empty planner lane shortcuts in canonical priority order.
2. Render those alternate lane buttons on the advisor signal cards while preserving the existing recommended lane CTA.
3. Cover the selector derivation and card interaction with targeted regression tests, then rerun the relevant proof commands.
