# Daily Planning Loop

## Goal

Add a persisted daily-planning layer on top of the existing `today` queue so users can start the day with a small intentional sweep instead of inheriting a stale bucket passively.

## Why Now

- The repo now has planning buckets, weekly focus, and weekly review, but it still lacks the day-level loop that turns those systems into an actual "start here" workflow.
- Recent productivity discussions keep converging on the same pattern: users want a constrained daily view that reduces planning overhead and forces a real decision about what belongs in today.
- This fits the current product architecture cleanly because it can reuse canonical advisor tasks plus the existing queue/scheduling actions instead of adding another task model.

## Plan

1. Add lightweight daily-planning state to the existing app-state and `user_app_meta` boundary, including a small per-day note plus completion timestamp.
2. Extend selectors with a daily-planning summary that highlights carry-over `today` tasks, focus work that still needs a same-day decision, and strong pull-in candidates from `this week` or unplanned backlog.
3. Add a dashboard card that lets the user capture today's headline, mark the daily plan done, and immediately rebalance tasks into `today`, `this week`, `later`, or scheduling.
4. Cover reducer, init, selector, component, and server-default behavior with regression tests, then rerun lint/test/build and refresh/validate the harness if the repo docs changed.

## Notes

- Keep the first pass entirely inside the existing app-owned state boundary. No notifications, background jobs, or separate daily task records.
- Treat the `today` planning bucket as canonical; daily-planning state should annotate the daily loop, not replace the queue.
