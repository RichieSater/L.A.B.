# Golden Compass Loading Flash Audit Fix

## Goal

Eliminate the Golden Compass loading flash caused by background auth/bootstrap refreshes remounting protected routes and immediately re-saving bootstrapped app state.

## Scope

- Stabilize `AuthProvider` bootstrap behavior around a stable signed-in user id.
- Keep protected routes mounted during background refreshes once a bootstrap snapshot exists.
- Stop `AppProvider` from sending `PUT /api/app-state` after rehydrating an unchanged snapshot.
- Add regression coverage for auth loading semantics, protected-route continuity, app-state autosave dedupe, and Compass route continuity.

## Implementation Notes

1. Update `src/auth/auth-context.tsx` so automatic bootstrap runs only on first sign-in, sign-out, or actual user-id change.
2. Preserve the last successful bootstrap snapshot during explicit refreshes for the same user and make `loading` mean “no usable bootstrap snapshot yet for the current user.”
3. Update `src/state/app-context.tsx` to track the last persisted serialized app-state snapshot and skip autosave when the current reducer state matches it.
4. Add tests that lock in:
   - same-user Clerk object churn does not refetch bootstrap
   - background refresh does not flip protected routes back to global loading
   - unchanged bootstrap rehydrates do not trigger `saveAppState`
   - Compass session routes do not refetch on background auth refresh

## Verification

- `npm run test:guardrails`
- `npm run lint`
- `npm run test`
- `npm run build`
- `harness validate .`
