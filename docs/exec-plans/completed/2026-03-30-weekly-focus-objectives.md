# Weekly Focus Objectives

## Goal

Add a persisted weekly-focus layer above the new planning queue so the user can anchor each week to a very small set of objective tasks instead of only moving items between buckets.

## Why Now

- The current branch already has planning buckets and a weekly review loop, but it still lacks the "what are the 1-3 things that matter this week?" layer that many planning tools use to keep daily choices coherent.
- External planning references consistently pair weekly review with either objectives or carry-forwarded focus items, not only queue counts.
- This repo already has the right canonical objects: open advisor tasks remain the source work items, while weekly focus can stay as lightweight metadata on the existing app-state boundary.

## Plan

1. Add persisted weekly-focus metadata keyed by week start and task identity without creating a second task system.
2. Extend selectors so the dashboard can derive current-week focus, previous-week carry-forward candidates, progress counts, and suggested tasks from the queue/review signals.
3. Add a dashboard weekly-focus card plus quick actions in the existing task surfaces so the user can pin or unpin focus tasks without context switching.
4. Cover reducer, selector, init, server, and UI behavior with regression tests, then re-run the repo verification baseline and refresh/validate the harness if docs changed.
