# Deploy-Safe Lazy Route Recovery

## Goal

Reduce broken navigations after a new deploy by handling failed Vite dynamic-import preloads with one controlled reload per URL and build version, and document the deploy-time caching boundary in the harness.

## Why Now

- The app has already started moving pages behind `React.lazy`, which is the right direction for startup performance.
- Vite documents that `vite:preloadError` fires when a dynamic import fails after a new deployment deletes old hashed assets, and explicitly recommends reloading in that case.
- The repo already contains bootstrap-time build mismatch recovery, but that only helps once authenticated bootstrap has started. A lazy route can still fail later during navigation.

## Plan

1. Add a small preload-recovery utility that listens for `vite:preloadError`.
2. Reload only once per URL and build version in the current tab to avoid infinite refresh loops while still allowing later deploys to recover.
3. Add regression tests around the recovery decision logic.
4. Update harness notes so deploy-time caching and lazy-route recovery are part of the durable repo context.
5. Re-run lint, tests, and build.
