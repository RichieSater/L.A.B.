# LAB Production Containment And Legacy GoldenCompass Removal

## Goal

Collapse LAB back to one repo root, one live codebase, and one canonical production URL by hardening repo-root checks, restoring deploy guardrails, and deleting the legacy standalone GoldenCompass surface.

## Plan

1. Confirm LAB already contains the intended Golden Compass recovery behavior and treat LAB as the only source of truth.
2. Add a repo-root preflight command and make `deploy.sh` refuse non-root, non-main, dirty-tree deploy attempts.
3. Restore a real `npm run test:guardrails` command so deploy docs, scripts, and verification notes agree again.
4. Update README plus harness repo notes so `lab-three-alpha.vercel.app` is the only canonical production URL and standalone GoldenCompass is explicitly decommissioned.
5. Refresh the harness and rerun validation after the command/documentation changes.
6. Remove the duplicate parent `.vercel` link, retire the extra LAB alias, and delete the standalone GoldenCompass Vercel project, GitHub repo, and local checkout.

## Verification

- `npm run preflight:lab-root`
- `npm run test:guardrails`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`
- `npx vercel inspect lab-three-alpha.vercel.app`
