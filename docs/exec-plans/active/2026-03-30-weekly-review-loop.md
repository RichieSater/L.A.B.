# Weekly Review Loop

## Goal

Add a persisted weekly review workflow on top of the new planning queue so users can regularly sweep `today`, `this week`, `later`, and `unplanned` work instead of letting the queue decay.

## Why Now

- The planning queue now creates a backlog-to-calendar bridge, but the product still lacks a recurring review moment that keeps that queue healthy.
- The existing follow-up research already identifies weekly planning/review as the highest-leverage next layer after queueing.
- This can stay inside the current server-owned app-state boundary instead of introducing notifications, background jobs, or another task system.

## Plan

1. Persist lightweight weekly-review state on the existing app-state boundary and make bootstrap/save flows keep it in sync.
2. Extend planning selectors with review-specific insights such as overdue queued work, stale `today` items, and high-priority unplanned tasks.
3. Add a dashboard review card that summarizes the current week and lets the user mark the review as complete.
4. Cover reducer, selector, server, and UI behavior with regression tests, then re-run repo verification and refresh harness docs if the architecture notes changed.

## Current Pass

- The first summary card exists, but the review flow is still passive.
- Turn the weekly review section into an actionable sweep surface that exposes the most important stale, overdue, and unplanned tasks inline.
- Reuse the existing planning and scheduling actions so a review can immediately move tasks into `today`, `this week`, `later`, or a calendar slot.
- Add selector and component coverage for the new review actions so the prioritization logic stays stable.
- Persist lightweight weekly reflection notes keyed by week so the review captures more than a checkbox.
- Show the previous completed review inline to create a real carry-forward loop between weeks.
- Add a weekly momentum digest so the review also answers "what actually happened this week?" with completed-task, session, and quick-log signal instead of only queue debt.
- Surface recent completed wins plus advisor-level activity/attention snapshots so the user can calibrate next-week planning against real momentum, not just backlog pressure.
