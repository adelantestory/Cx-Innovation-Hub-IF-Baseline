# Demo Script — Chat Mode (Backend Scaffold)

**Feature:** Task Priority Badge — adds a `priority` field (`low` / `medium` / `high`) to tasks and an endpoint to update it.

**Goal of this demo:** Show how Copilot Chat can scaffold a multi-file change (schema + API + validation + new endpoint) from a single prompt that follows existing codebase patterns.

**Time:** ~5 minutes.

---

## Pre-demo checklist

```pwsh
# 1. Create a throwaway branch from your current demo branch
git checkout -b demo/copilot-priority-badge

# 2. Confirm clean working tree
git status

# 3. Start fresh containers (DB seeded, API + web up)
docker compose down -v
docker compose up -d

# 4. Open these files in editor tabs so Chat has them in context:
#    - concept/sql/001_create_tables.sql
#    - concept/apps/api/src/routes/tasks.js

# 5. Open the Copilot Chat panel

# --- after rehearsal: reset working tree to re-run ---
git restore .
docker compose down -v && docker compose up -d

# --- when done with the demo entirely ---
git checkout demo/playwright-testing
git branch -D demo/copilot-priority-badge
```

---

## Step 1 — Frame the problem (30s)

Say to the audience:

> "I want to add a priority field to tasks. It needs to land in three places: the database schema, the API responses, and a new endpoint to update it. Let's see Copilot Chat handle all of that in one shot."

Show the two open files briefly so the audience sees the starting code.

---

## Step 2 — Paste the prompt (1m)

Paste this into Copilot Chat:

> Add a `priority` field to tasks. It should be a TEXT column with values `low`, `medium`, or `high`, defaulting to `medium`, with a CHECK constraint. Update `concept/sql/001_create_tables.sql` to add the column. Update `concept/apps/api/src/routes/tasks.js` so that:
> 1. `priority` is selected and returned in all task responses (GET list, POST, PUT, PATCH).
> 2. `priority` can be supplied when creating a task (POST), defaulting to `medium`.
> 3. A new endpoint `PATCH /api/tasks/:id/priority` validates the value and updates only the priority. Mirror the style of the existing `PATCH /api/tasks/:id/assign`.

---

## Step 3 — Narrate while it generates (1m)

As the diff streams in, point out:

- **"Multi-file edit"** — one prompt, edits to both files at once.
- **"Pattern matching"** — Copilot saw the existing `VALID_STATUSES = [...]` constant and produced `VALID_PRIORITIES = [...]` in the same style.
- **"Codebase consistency"** — the new `PATCH /priority` route reuses the `LEFT JOIN users` projection used by the other handlers.
- **"Validation included"** — it didn't just write a happy path; it added the `400` guard for invalid values.

---

## Step 4 — Accept and verify (1.5m)

1. Click **Accept** on the diff.
2. Restart the API container so the changes pick up:
   ```pwsh
   docker compose restart api
   ```
3. Apply the new column to the running DB (the schema file only runs on first boot, so for an existing volume run a quick migration):
   ```pwsh
   docker compose exec db psql -U taskify -d taskify -c "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high'));"
   ```
   *(Or just `docker compose down -v && up -d` to recreate from `001_create_tables.sql` cleanly. Faster for a demo.)*
4. Grab a task ID:
   ```pwsh
   curl http://localhost:3000/api/projects/b1111111-1111-1111-1111-111111111111/tasks
   ```
5. Hit the new endpoint:
   ```pwsh
   curl -X PATCH http://localhost:3000/api/tasks/<task-id>/priority `
     -H "Content-Type: application/json" -d '{\"priority\":\"high\"}'
   ```
   → Returns the updated task with `priority: "high"`.

---

## Step 5 — (Optional) Show the validation guard (30s)

Only if your audience cares about quality/security:

```pwsh
curl -X PATCH http://localhost:3000/api/tasks/<task-id>/priority `
  -H "Content-Type: application/json" -d '{\"priority\":\"urgent\"}'
```

→ Returns `400 Invalid priority. Must be one of: low, medium, high`.

Talking point: "Copilot didn't just write the happy path — it generated the input validation we asked for, matching the pattern it saw elsewhere in the file."

---

## Closing line

> "Chat mode just produced ~80 lines of correct, consistent backend code from a single prompt. Next, watch the same feature get finished in the UI using inline completions."

---

## Troubleshooting during the demo

| Issue | Fix |
|---|---|
| Copilot edits wrong file | Make sure both target files are *open in tabs* (not just in the workspace). |
| `priority` column missing in DB after restart | Volume is stale; run `docker compose down -v && docker compose up -d`. |
| `400` on the happy-path call | Check the JSON body quoting in PowerShell — escape inner quotes with `\"` or use single quotes around the body. |
| Diff too long to read on screen | Open the file's diff view in the editor instead of scrolling Chat. |
