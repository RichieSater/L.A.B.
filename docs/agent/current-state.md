# Current State

## Product Surface

The durable product baseline is a planning-first "Life Advisory Board" app:

- a weekly-first home that combines strategic planning, task triage, and weekly focus in one primary view
- advisors tab with an advisor-attention radar that suggests the next meaningful action per advisor
- advisor detail pages that now share the same canonical planner actions for queue buckets, weekly focus, and scheduling without a second task model
- canonical advisor tasks with a persisted planning queue layered on top of them (`today`, `this week`, `later`, `unplanned`)
- a daily-planning loop, weekly focus layer, and weekly review flow with stored reflection notes
- an in-app Golden Compass flow with autosaved sessions, derived strategy insights, and a server-owned strategic dashboard for year / quarter / month planning
- strategic goal rows keep a durable link to the canonical advisor task they promoted, so re-promoting a goal updates existing planner work instead of duplicating it
- open linked strategic tasks can now be re-bucketed or added/removed from weekly focus directly from the strategic planner without leaving the weekly-first view
- a weekly momentum digest plus a recent-activity timeline derived from completed tasks, sessions, quick logs, and completed planning/review rituals
- the weekly review now includes a deterministic recap built from those same signals, compressing wins, active advisors, unfinished pressure, and next-week focus without a second summary store
- scheduled advisory sessions with optional one-way Google Calendar sync and an explicit manual sync-health repair action

## Durable Boundaries

- `api/` stays thin; business rules and persistence live in `server/`
- `server/data.ts` plus Drizzle/Neon are the source of truth for persisted app state
- client state may cache or stage edits, but planning, review, Compass progress, scheduling, metrics, and calendar sync remain server-owned
- the queue, strategic dashboard, daily planning, weekly focus, weekly review, and recent-activity timeline are layered on canonical tasks/sessions instead of creating duplicate record systems

## Verification Status

- The weekly-first dashboard, Compass session flow, strategic dashboard, and advisor/planner write-through behavior have now been rerun through lint, tests, build, and guardrails in this worktree and should be treated as the current verified baseline.
- Legacy `weekly` and `GoldenCompass` repos remain reference apps outside this repo; LAB is the active product surface and source of truth.
