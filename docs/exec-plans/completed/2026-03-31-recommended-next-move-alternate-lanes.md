# Recommended Next Move Alternate Lanes

## Goal

Let the weekly planner's `Recommended Next Move` callout expose other currently non-empty planner lanes so the user can keep sweeping the live queue without hunting through the preset bar.

## Why Now

- The roadmap's active LAB-unification pass is still planner polish plus tighter advisor-action routing on top of the canonical task/planning store.
- The weekly task list already derives one highest-signal lane, but the callout currently strands the user on a single CTA even when other meaningful lanes are active.
- Surfacing alternate live lanes extends the existing preset model and should preserve the active advisor scope automatically instead of inventing another planner state concept.

## Plan

1. Update `TaskDashboard` so the recommendation banner derives and renders alternate non-empty preset shortcuts alongside the primary recommendation.
2. Keep those alternate shortcuts scoped to the current advisor filter when one is active, reusing the existing preset/reset behavior.
3. Add regression coverage for global and advisor-scoped alternate-lane pivots, then rerun focused and baseline verification.
