# Golden Compass PDF Fidelity Rebuild

## Goal

Rebuild the in-app Golden Compass as a PDF-first digital replica of `The-Golden-Compass-by-Timothy-Marc.pdf`, preserving the full workbook flow, save/resume behavior, and LAB integration while making the completed Compass answers more reusable across advisors and strategic surfaces.

## Why Now

- The current Compass implementation covers the broad themes but compresses or omits large parts of the workbook, which makes the in-app version feel bare compared with the PDF source.
- The Compass session boundary is already server-owned, so a richer replica can be layered on the existing persistence model without introducing a second record system.
- LAB already depends on Compass output for year-goal seeding and advisor context, so the missing workbook detail should become structured reusable context instead of staying trapped in a thinner UI-only flow.

## Plan

1. Expand shared Compass flow/types so each screen can represent richer PDF-style instructional content plus grouped prompts on a single page.
2. Replace the current compressed screen inventory with a PDF-faithful order spanning setup, Bonfire, Past, Future, Perfect Day, calibration, Lighting the Path, Golden Path, time capsule, and congratulations.
3. Refactor the Compass session runner and test helpers around the richer screen model while preserving autosave, save-and-exit, completion, and robust resume behavior for existing sessions.
4. Extend completed Compass context extraction so LAB stores a richer normalized latest-compass payload in strategic state without changing the raw `compass_sessions.answers` contract or year-goal seeding rules.
5. Add parity, runner, prompt, server, and Playwright coverage for the longer workbook flow, then rerun repo verification plus harness refresh/validate.

## Notes

- Keep the copy PDF-first unless accessibility or the existing LAB shell requires a light adaptation.
- Include the time capsule and congratulations closeout, but omit the creed and promotional tail pages.
- Use structured text fields for sketch/box pages instead of introducing drawing canvases.
