# Advisor Attention Queue Summary

## Goal

Keep the Attention Radar summary stats aligned with the planner-routing behavior now that schedule-first and quick-log-first cards can also expose live Weekly LAB lanes.

## Why Now

- The approved roadmap slice is still planner polish plus stronger advisor-action routing on top of the canonical task/planning store.
- Recent radar work added alternate planner shortcuts to non-planning cards, but the top-line `Queue Decisions` stat still only counts cards whose primary action is `plan`.
- That mismatch makes the radar under-report live queue pressure right where the user expects a high-level rollup.

## Plan

1. Count any advisor with a live planner lane in the radar queue summary, even when the primary nudge is schedule or quick log.
2. Update focused selector and panel regression coverage so the summary stays aligned with the visible planner shortcuts.
3. Re-run the relevant tests, then archive this slice into `docs/exec-plans/completed/`.
