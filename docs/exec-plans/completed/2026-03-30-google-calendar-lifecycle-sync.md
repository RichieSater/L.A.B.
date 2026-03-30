# Google Calendar Lifecycle Sync

## Goal

Keep scheduled-session sync state consistent when a user connects or disconnects Google Calendar after sessions already exist.

## Why Now

- Sessions created before Google Calendar is connected currently stay unsynced unless the user manually edits them later.
- Disconnecting Google Calendar currently clears the profile connection but leaves session-level sync metadata and remote events behind.
- This is a persistence and integration boundary bug, so it needs regression coverage before the next deploy.

## Plan

1. Backfill all scheduled sessions when Google Calendar is connected successfully.
2. Best-effort delete synced Google Calendar events and clear local sync metadata when disconnecting.
3. Treat already-deleted remote events as non-fatal during cleanup.
4. Add regression tests around the connect/disconnect lifecycle behavior.
5. Update repo notes so the harness documents the lifecycle expectation.
