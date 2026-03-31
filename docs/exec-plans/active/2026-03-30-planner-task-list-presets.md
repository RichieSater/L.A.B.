# Planner Task List Presets

## Goal

Tighten the weekly-first planner shell with quick task-list presets that jump directly into the highest-signal canonical work.

## Checklist

- Add a small "next move" preset strip above the raw task list in the weekly planner shell.
- Keep presets derived from existing canonical planner signals: unplanned backlog, stale `today`, overdue work, and weekly focus.
- Reset the lower-level list filters to a sensible baseline when a preset is selected so the list does not end up empty from stale custom filters.
- Add regression coverage for preset-driven filtering without introducing a second planner state model.

## Acceptance Criteria

- Users can jump the raw task list to triage, carry-over, overdue, or focus work with one click.
- Presets only filter existing canonical task items; they do not create or persist separate list state in the data model.
- The task list remains available for custom filtering after preset use.
