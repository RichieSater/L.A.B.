# Researched Follow-Up Opportunities

The current repo is in a good local baseline on March 30, 2026:

- `harness validate` passes.
- `npm run lint`, `npm run test`, and `npm run build` all pass.
- The startup-path work is landed enough that the public entry chunk is now around `9.4 kB`, with stable `router`, `clerk`, and `react-vendor` chunks held behind explicit bundle budgets.

That means the next work should optimize for product leverage and future-proofing rather than more cleanup.

## 1. Calendar Change Detection Without Blind Polling

### Why it matters

- The current Settings copy correctly describes Google Calendar as one-way sync, but the integration still has a user-trust gap: if a user edits or deletes one of the synced events in Google Calendar, L.A.B. will keep stale local scheduling state.
- Google documents two important constraints here:
  - incremental sync requires persisted sync tokens and exact query consistency;
  - repeated polling is a quota anti-pattern, and server-side push notifications are the preferred model when the app needs to react to external changes.
- Because this repo is a Vercel-style app without an always-on worker, the practical next step is not full watch-channel infrastructure yet. The pragmatic first pass is an explicit reconciliation design that does not accidentally turn bootstrap into quota-heavy polling.

### Proposed task

1. Decide the product contract first: is Google Calendar still strictly one-way, or should external edits become authoritative for scheduled sessions?
2. Implement a lightweight reconciliation path for app-owned events only.
3. If two-way behavior is desired later, add persisted sync metadata and design toward push channels instead of bootstrap polling.
4. Add regression coverage for deleted, moved, and externally edited events before changing the contract in UI copy.

### Sources

- Google Calendar incremental sync guide: <https://developers.google.com/workspace/calendar/api/guides/sync>
- Google Calendar quota guidance: <https://developers.google.com/workspace/calendar/api/guides/quota>
- Google Calendar push notifications: <https://developers.google.com/workspace/calendar/api/guides/push>

## 2. Daily Planning Queue Above Raw Scheduling

### Why it matters

- The repo already has quick logs and explicit scheduled sessions, but there is still no intermediate planning layer between "capture something" and "book a specific advisory session."
- This is the clearest product opportunity from outside research: users of note-taking and planning tools consistently want a backlog that rolls into a day or week view, then gets turned into time-specific work only when needed.
- That fits the current product better than adding more advisor-specific complexity first.

### Proposed task

1. Add a small planning model for unscheduled advisor follow-ups or action items.
2. Surface a "today / this week / unscheduled" queue on the dashboard.
3. Let scheduling promote an item from the queue into a concrete session instead of forcing time commitment up front.
4. Keep persistence simple by storing the planning queue on the existing server-side state boundary rather than introducing new client-only caches.

### Sources

- Reddit discussion on ideal daily notes/tasks flow and backlog-to-calendar planning: <https://www.reddit.com/r/NoteTaking/comments/1gqe4n3/my_ideal_daily_notestasks_app_my_journey_finding/>
- Habit-tracker feature backlog reference: <https://github.com/nicopanozo/react-habit-tracker>

## 3. Reminders And Review Loops

### Why it matters

- Competing journaling and habit tools repeatedly emphasize reminders, recurring reflection prompts, and lightweight review loops because those are what make logging sticky instead of merely available.
- L.A.B. already has the data model ingredients for this: quick logs, shared metrics, and scheduled sessions.
- Adding reminders is more valuable than adding another integration, but it needs a crisp boundary because the repo does not yet have a dedicated background-job system.

### Proposed task

1. Start with in-app reminder surfaces: overdue nudges, next-session nudges, and a weekly review card.
2. Add a durable review prompt that summarizes quick logs and advisor momentum for the week.
3. Defer email/push delivery until the reminder model exists inside the product.
4. After the in-app loop proves useful, choose whether to add browser notifications, email, or calendar-native reminders.

### Sources

- Reddit journaling app discussion highlighting reminder expectations: <https://www.reddit.com/r/iosapps/comments/1g6hcax/my_journal_simple_journaling_affirmations_quotes/>
- Journal Tree feature/future-feature framing for prompts, trends, and suggestions: <https://github.com/Journal-Tree/Journal-Tree>

## 4. Vite 8 / Rolldown Migration Spike

### Why it matters

- The current chunking strategy works today, but it depends on `build.rollupOptions.output.manualChunks`.
- Vite's current migration docs state that the function form of `manualChunks` is deprecated, and the Rolldown path is moving toward `build.rolldownOptions` plus more flexible code-splitting controls.
- This is not urgent today, but it is visible tech debt now, not hypothetical future debt.

### Proposed task

1. Run an isolated Vite 8 / Rolldown branch spike.
2. Capture the current chunk graph and compare it to the Rolldown output.
3. Replace the current manual chunk function with a Rolldown-compatible approach before a framework upgrade makes the migration urgent.
4. Keep the bundle-budget script as the regression oracle during the migration.

### Sources

- Vite v7 Rolldown integration guide: <https://v7.vite.dev/guide/rolldown>
- Vite migration notes for manual chunk deprecation: <https://main.vite.dev/guide/migration.html>
- Vite 8 beta announcement: <https://vite.dev/blog/announcing-vite8-beta>

## 5. Stronger Deploy Transition Strategy

### Why it matters

- The repo already has bounded reload recovery for failed lazy-route loads, which is the right fallback.
- Vite's troubleshooting guidance is explicit that version skew is still an architectural deploy concern and recommends keeping old chunks available temporarily, using a service worker, prefetching dynamic chunks, or handling load failures gracefully.
- The long-running Vite issue on failed dynamic imports during active sessions confirms the failure mode is common in production, not a repo-specific anomaly.

### Proposed task

1. Decide whether Vercel deploys for this app should keep old static assets available for a short overlap window.
2. If not, evaluate a narrowly scoped service worker only for static asset continuity.
3. Verify that any deploy strategy continues to respect auth boundaries and does not cache API responses incorrectly.
4. Keep the existing lazy-route recovery even after stronger asset continuity lands.

### Sources

- Vite troubleshooting guide: <https://vite.dev/guide/troubleshooting.html#failed-to-fetch-dynamically-imported-module>
- Vite issue `#11804`: <https://github.com/vitejs/vite/issues/11804>
