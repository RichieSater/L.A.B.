# Bundle Budget Regression Guard

## Goal

Make startup bundle regressions fail explicitly instead of relying on someone to notice Vite's raw build output.

## Why Now

- The repo already split the protected shell and vendor code into stable chunks.
- The current build is green, which makes this a good time to lock in a baseline.
- Vite documents both chunk-size warnings and the build manifest, so a post-build budget check is a supported approach rather than a brittle scrape of terminal output.

## Plan

1. Enable a production manifest so the budget checker can resolve stable chunk names to hashed files.
2. Add a small Node-based bundle-budget script with unit coverage.
3. Run the checker as part of `npm run build` so deploys inherit the guard automatically.
4. Update repo docs and refresh the harness so verification notes mention the budget gate.
