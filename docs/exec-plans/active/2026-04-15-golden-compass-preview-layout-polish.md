# Golden Compass Preview Layout Polish

## Summary

Tighten the shared Golden Compass preview formatting so the `The Past` month-by-month review uses desktop width intelligently instead of reserving a blank second column. Keep this pass preview-only so both checkpoint previews and the final `View Compass` page improve through the same shared renderer.

## Key Changes

- make the preview section entry grid data-driven so single-entry sections render full width while multi-entry sections keep the existing split layout
- make grouped month-review cards denser on larger screens with a `1 / 2 / 3` responsive column progression
- preserve the current preview visual language, print treatment, and answer formatting without touching routes, persistence, or flow data

## Verification

- add focused renderer coverage for single-entry `past` sections and the grouped month grid classes
- re-run `npm run lint`
- re-run `npm run test`
- re-run `npm run build`
