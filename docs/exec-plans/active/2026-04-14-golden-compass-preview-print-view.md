# Golden Compass Preview And Print-Ready Final View

## Summary

Add a shared Golden Compass preview layer that formats captured answers into a polished document view, then reuse it:

1. after `past-monthly-events`
2. after `lighting-self-rewards`
3. on a dedicated final `View Compass` page with browser print/save-to-PDF support

## Key Changes

- add a dedicated Compass view route and helper for `/golden-compass/:sessionId/view`
- extend the Compass screen model with preview metadata so checkpoint screens are first-class flow entries
- build one shared preview formatter/presenter that groups meaningful answers by workbook section
- keep month-by-month review labels anchored to the session creation date plus the saved include-current-month toggle
- render preview checkpoints inside the runner as read-only document slices
- add a final full preview page with `Back` and `Download PDF`
- update completed Compass UI so the end-state summary and completed library cards both expose `View Compass`

## Verification

- unit-test the preview formatter
- extend runner coverage for both preview checkpoints and completed `View Compass` affordance
- add page coverage for the new view route and print action
- update dashboard coverage so completed cards use `View Compass` while in-progress cards still resume normally
