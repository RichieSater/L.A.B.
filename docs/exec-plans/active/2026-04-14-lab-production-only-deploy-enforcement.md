# LAB Production-Only Deploy Enforcement

## Summary

Lock LAB deployment behavior to one and only one valid target: `https://lab-three-alpha.vercel.app/`.

## Key Changes

- harden repo instructions so LAB deploys are production-only and alternate Vercel surfaces are explicitly invalid
- tighten `deploy.sh` so blocked production prereqs fail with a direct production-only message instead of leaving room for preview fallbacks
- keep `scripts/verify-lab-root.sh` aligned with the same canonical production URL
- add a guardrail test that checks the deploy script plus LAB repo docs for canonical-URL-only guidance

## Verification

- `npm run test:guardrails`
- `npm run lint`
- `npm run test`
- `npm run build`
