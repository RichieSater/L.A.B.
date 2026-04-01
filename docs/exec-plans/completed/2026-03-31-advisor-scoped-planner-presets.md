# Advisor-Scoped Planner Presets

## Goal

Keep weekly-planner preset switching and the "Recommended Next Move" callout aligned with the current advisor scope instead of dropping back to a global task view.

## Why Now

- The roadmap's current approved slice is planner polish plus tighter advisor-action routing on top of the canonical task/planning store.
- Advisor-attention routing already lands the weekly task board on an advisor-scoped preset, but the preset buttons and recommendation CTA still clear that scope unless the user reapplies it manually.
- Fixing the handoff keeps the existing single-store planner model intact while making the advisor-to-planner loop feel intentional.

## Plan

1. Update `TaskDashboard` so preset changes and the recommendation CTA preserve the current advisor scope by default.
2. Derive preset counts and the recommended next move from the active advisor scope when one is applied.
3. Add regression coverage for scoped recommendations and scoped preset switching, then rerun focused and baseline verification.
