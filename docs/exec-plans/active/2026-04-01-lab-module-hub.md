# LAB Module Hub

## Goal

Make `/` the protected LAB module hub so users choose a top-level module first instead of landing directly inside Weekly LAB.

## Why Now

- The product now has enough durable surfaces that the old single-dashboard home no longer matches the mental model.
- The user wants LAB to feel like a system with distinct modules, while still preserving the current weekly planner, advisory, and Compass functionality.
- This can be implemented without duplicating feature logic by reusing the existing dashboard panels behind focused module routes.

## Plan

1. Add shared route constants and module metadata for the new top-level module model.
2. Build a polished module hub at `/` with active cards for Quantum Planner, Advisory Board, and Golden Compass plus keyboard-accessible coming-soon cards for Bonfire, Morning Ship, and Scorecard.
3. Move the live module surfaces onto dedicated routes and refactor the dashboard container so focused module pages can expose only the tabs they own.
4. Retarget planner-specific `/` handoffs to `/quantum-planner`, move advisory detail flows back to Advisory Board, and make Compass UI prefer the new Golden Compass route while keeping legacy `/compass` URLs alive.
5. Add regression coverage for auth redirects, module hub behavior, focused dashboard routing, and planner handoff paths, then rerun lint, test, and build.

## Notes

- Keep deep planner copy that says `Weekly LAB` in place for this pass.
- Treat Bonfire as a separate future module even though Compass already contains a Bonfire section.
