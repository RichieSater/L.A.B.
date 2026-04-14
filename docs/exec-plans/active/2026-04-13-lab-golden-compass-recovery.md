# LAB-Only Golden Compass Recovery And Repo-Boundary Guardrails

## Summary

The wrong-repo incident was a LAB process failure plus a Golden Compass UX regression. This slice fixes both in the active LAB repo by making the repo boundary impossible to miss in docs, then refactoring the in-app Golden Compass flow from `past-golden-moments` forward so list-shaped prompts use the add-item builder, concise prompts use short inputs, and delete is visible for every Compass card.

## Key Changes

1. Harden LAB entry docs so they explicitly state that `/Users/richiesater/dev/L.A.B/L.A.B.` is the only active LAB product repo and deploy target, while sibling `GoldenCompass` and `weekly` repos are legacy reference-only.
2. Add a Golden Compass preflight checklist to LAB docs: confirm `pwd`, confirm `git rev-parse --show-toplevel`, and confirm the top-level path is `/Users/richiesater/dev/L.A.B/L.A.B.` before any Compass work.
3. Refactor Compass prompt metadata and runner normalization so converted list prompts can read canonical JSON arrays, legacy newline text, and legacy fixed keys like `goal1/goal2/goal3`.
4. Convert the audited Golden Compass prompts from `past-golden-moments` forward to the intended `multi-input`, `short-text`, or `textarea` control types without changing LAB's current screen grouping.
5. Upgrade the list-builder UI so it visibly reads as an add-item flow, supports exact-count constraints, and preserves the intended keyboard shortcuts.
6. Extend Compass dashboard deletion to all session cards while keeping completed-only lifecycle actions unchanged.
7. Update Compass insight extraction, prompt/context rendering, tests, and end-to-end coverage so legacy sessions still hydrate correctly after the refactor.

## Verification

- `npm run test:dev-api`
- `npm run lint`
- `npm run test`
- `npm run build`

## Notes

- This slice only touches LAB. Do not modify or deploy the legacy standalone `GoldenCompass` repo.
- No DB migration is expected; the existing LAB Compass delete path already exists on the server.
