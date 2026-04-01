# Harness State-Doc Repair

## Goal

Restore the repo harness to a valid, trustworthy state without rewriting the documented LAB product baseline.

## Why Now

- `harness validate .` is red in the canonical repo, which blocks feature work under the automation rules.
- `docs/agent/current-state.md` and `docs/agent/roadmap.md` had drifted out of the managed harness format.
- An old bootstrap-regression plan is still parked under `docs/exec-plans/active/`, which keeps maintenance open even though the guardrails for that regression are already part of the repo baseline.

## Plan

1. Refresh the harness-generated files so the managed markers and entrypoint docs are back in sync.
2. Archive stale maintenance-only plan state that no longer represents the next active slice.
3. Update the manual sections of `docs/agent/current-state.md` and `docs/agent/roadmap.md` so they describe the verified LAB baseline and the approved next slice accurately.
4. Re-run `harness validate .` and close this plan into `docs/exec-plans/completed/`.

## Acceptance Criteria

- `harness validate .` passes.
- `current-state.md` and `roadmap.md` keep the managed harness structure and still describe the actual LAB product shape.
- The repo no longer reports maintenance as open solely because of stale active-plan bookkeeping.

## Outcome

- Refreshed the harness-managed entrypoint docs and restored the managed markers in the state/roadmap pair.
- Archived the stale dev-API bootstrap regression plan into `completed/` now that the guardrail coverage is part of the documented baseline.
- Updated the manual state/roadmap notes so the repo docs describe the verified LAB baseline and the next approved feature direction without treating in-flight dirty worktree changes as missing product.
