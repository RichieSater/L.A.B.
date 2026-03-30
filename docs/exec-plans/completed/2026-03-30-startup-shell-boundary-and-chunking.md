# Startup Shell Boundary And Chunking

## Goal

Reduce the amount of protected-app code that the public login and signup routes download up front, and split the remaining stable vendor code into cache-friendly chunks.

## Why Now

- The repo already moved page routes behind `React.lazy`, but `App.tsx` still imports the protected shell and providers eagerly.
- That means the public auth routes still pay for signed-in dashboard scaffolding before it is needed.
- Vite explicitly supports configuring chunk boundaries with `build.rollupOptions.output.manualChunks`, so this is a supported optimization path instead of a bundler hack.

## Plan

1. Move the protected shell into its own module and lazy-load it with the protected route boundary.
2. Lazy-load the protected route guard so public auth screens do not import protected-only UI.
3. Add minimal manual chunk rules for stable vendor groups that should cache independently.
4. Rebuild and compare the emitted bundle sizes.
5. Refresh and validate the harness if the repo shape or generated docs change.
