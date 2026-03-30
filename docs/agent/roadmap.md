# Roadmap

## Landed Base

These slices are part of the current documented product shape and should not be reopened as the next major milestone:

- weekly-first planner home with strategic panes and Compass entry points
- advisor attention radar
- task-planning queue with explicit `unplanned` triage
- daily-planning loop
- weekly focus
- weekly review with reflections and momentum digest
- recent-activity timeline
- deterministic weekly recap derived from recent activity plus review/planner signals
- Golden Compass session persistence plus strategic-dashboard seeding
- Google Calendar lifecycle sync plus manual sync-health reconciliation

Only reopen those areas for verified regressions or when a new approved slice explicitly extends them.

## Now

Top approved slice: deepen the unified LAB experience now that Compass, strategy, and the weekly-first shell are landed.

Required outcomes for this slice:

- tighten the planner polish and interaction details on top of the canonical task model
- extend advisor actions and prompts where needed without creating duplicate planning state
- keep Compass and strategic surfaces aligned with the verified persistence boundary

Do not reopen the old split-app architecture or introduce a second weekly task store.

## Next

1. add the deferred weekly-specific extras only if they still fit the single-store architecture: brainstorm capture, QL scorecards, and automatic time-block suggestions
2. deepen the advisor-to-planner loop with more intentional write actions and review surfaces
3. decide when to archive or retire the legacy `weekly` and `GoldenCompass` repos after the LAB cutover is stable

## Later

- PDF export and richer Compass history handling once the core unified flow settles
- AI-generated reflection language on top of a deterministic weekly recap payload
- Google Calendar external-change detection designed around explicit reconciliation first and push/incremental sync later, not blind polling
- Vite 8 / Rolldown migration spike with bundle-budget checks as the regression oracle
- stronger deploy asset-transition strategy beyond bounded lazy-route recovery
