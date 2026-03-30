# Local Date Boundary Fix

## Goal

Remove UTC date drift from client-side "today" logic and schedule editing so quick logs, due-date comparisons, calendar rendering, and schedule defaults all respect the user's local calendar day.

## Why Now

- The repo currently derives date-only values with `toISOString().split('T')[0]`, which uses UTC rather than the local day.
- That can mark tasks overdue early, stamp quick logs onto the wrong date, and prefill scheduled-session edits with the wrong local date/time for users outside UTC.
- This is a shared utility boundary, so fixing it once is higher leverage than layering UI work on top of it.

## Plan

1. Replace UTC-based date-only formatting with a local-date helper.
2. Use the shared helper everywhere the client needs a local `YYYY-MM-DD` or `HH:MM` value.
3. Add regression tests that prove the helper respects an explicit non-UTC timezone.
4. Update the harness notes so future work does not reintroduce `toISOString().split('T')[0]` for local calendar logic.
5. Re-run harness validation, lint, tests, and build.
