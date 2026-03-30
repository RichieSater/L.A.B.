# Task Planning Queue

## Goal

Add a persisted planning layer above raw advisor tasks so users can decide what belongs in `today`, `this week`, or `later` before committing to a specific scheduled session.

## Why Now

- The repo already has action-item capture and concrete scheduled sessions, but it still lacks the middle step between "this matters" and "put it on the calendar."
- The existing follow-up research in [`2026-03-30-follow-up-opportunities.md`](./2026-03-30-follow-up-opportunities.md) calls this the clearest product-leverage opportunity.
- The cleanest implementation is to keep advisor tasks as the source work items and persist planning metadata separately, rather than duplicating a second task system.

## Plan

1. Add a durable planning-assignment model keyed by advisor task identity and store it on the existing server-owned persistence boundary.
2. Extend app bootstrap/save flows plus reducer/selectors so open tasks can be grouped into `today`, `this week`, `later`, and `unplanned`.
3. Surface the planning queue above the existing task list and let users move tasks between buckets or remove them from the queue.
4. Let a planned item open the scheduling flow so queue-to-calendar is a first-class path.
5. Add regression coverage for selector/reducer behavior and server persistence defaults, then re-run the repo verification baseline.

## Current Pass

- Keep the persisted planning model intact and finish the UX gap that remained after the first pass: `unplanned` should be visible as a real triage lane, not only as a summary count.
- Add planning-state filtering to the raw task list so users can focus on either committed queue items or backlog cleanup.
- Add UI regression coverage around the planning board itself, not only reducer/selector tests.
