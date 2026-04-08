# User Tiers And Admin Access

## Goal

Add server-owned user tiers so free users only access Golden Compass, premium users access the live LAB modules, and admins also get a user-management dashboard.

## Why Now

- The app now has multiple distinct modules, but all authenticated users currently receive the same product surface.
- The requested rollout is manual-access based, so the server needs a durable entitlement source of truth that the router, module hub, and admin APIs can share.
- Admins also need a lightweight internal dashboard to assign `free` or `premium` without introducing billing or a second user store.

## Plan

1. Extend `user_profiles` with `account_tier` and `primary_email`, backfill existing users to `premium`, and sync Clerk identity details plus admin allowlist promotion inside the server bootstrap boundary.
2. Expand bootstrap/profile types and API inputs so the client receives `accountTier`, while self-serve profile updates stay limited to name and scheduling fields.
3. Add shared entitlement helpers for module metadata, route gating, and locked module hub cards so free/premium/admin behavior stays consistent across direct navigation and the home surface.
4. Add admin-only list/update endpoints plus a minimal `/admin` dashboard that shows users by email/display name and lets admins switch non-admin users between `free` and `premium`.
5. Add regression coverage for the new tier contract, admin protection, locked module UX, and route redirects; then refresh and validate the harness after verification.

## Notes

- Admin seeding is env-based through `LAB_ADMIN_EMAILS`; the UI does not grant or revoke `admin`.
- “All modules” means the current live surfaces only: Quantum Planner, Advisory Board, and Golden Compass.
