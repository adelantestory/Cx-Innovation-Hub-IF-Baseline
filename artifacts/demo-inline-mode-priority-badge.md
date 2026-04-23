# Demo Script — Inline Mode (UI Badge)

**Feature:** Task Priority Badge — colored pill on each Kanban card; click to cycle `low → medium → high`.

**Goal of this demo:** Show how Copilot inline completions accelerate small, predictable UI work — type a comment or signature, press Tab, ship the line.

**Time:** ~5 minutes.

**Prerequisite:** The Chat-mode demo (backend scaffold) must already be applied so the API returns `priority` and the `PATCH /api/tasks/:id/priority` endpoint exists.

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

# 4. Apply the backend scaffold from the Chat-mode demo first
#    (or commit it on this branch as the starting state for this demo)

# 5. Open these files in editor tabs:
#    - concept/apps/web/src/api/types.ts
#    - concept/apps/web/src/api/client.ts
#    - concept/apps/web/src/components/kanban/Card.tsx

# 6. Confirm inline suggestions are enabled (status bar Copilot icon)
# 7. Close Copilot Chat panel — keep focus on the editor

# --- after rehearsal: reset working tree to re-run ---
git restore .
docker compose down -v && docker compose up -d

# --- when done with the demo entirely ---
git checkout demo/playwright-testing
git branch -D demo/copilot-priority-badge
```

---

## Step 1 — Frame the problem (20s)

Say:

> "Backend is done. Now I need the UI: each card should show a colored pill, and clicking it cycles the priority. I'll build it without ever opening Chat — just inline completions."

---

## Step 2 — Add `priority` to the type (30s)

Open `concept/apps/web/src/api/types.ts`. Inside the `Task` interface, position the cursor at the end of the `status` line and press Enter. Type:

```ts
  priority:
```

→ Copilot suggests: `priority: "low" | "medium" | "high";`. Press **Tab**.

**Talking point:**
> "It inferred the union from the schema we just wrote in the previous step — Copilot uses workspace context, not just this file."

---

## Step 3 — Add the API client function (45s)

Open `concept/apps/web/src/api/client.ts`. Below the `assignTask` function, type:

```ts
// Update the priority of a task
export function updateTaskPriority(
```

→ Copilot completes the full function body — parameters, fetch call to `PATCH /api/tasks/:id/priority`, return type. Press **Tab**.

If it imports `TaskPriority`, point out:

> "Notice the import — it found the type we just added."

---

## Step 4 — Build the badge in `Card.tsx` (1.5m)

Open `concept/apps/web/src/components/kanban/Card.tsx`.

### 4a. Color map

Above the `Card` component (just under the imports), type:

```tsx
// Tailwind color classes by priority
const priorityStyles =
```

→ Copilot completes a `Record<TaskPriority, string>` with `low: "bg-gray-..."`, `medium: "bg-amber-..."`, `high: "bg-red-..."`. Tab to accept.

### 4b. Render the badge

Inside the JSX, just below the title `<p>`, type:

```tsx
<span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityStyles[
```

→ Copilot completes the indexing (`task.priority]}`), the `>{task.priority}</span>`. Accept.

**Talking point:**
> "I gave it the *shape* of the badge — Tailwind utility prefix and the start of a template literal — and it filled in the rest from the map I just defined."

---

## Step 5 — Click-to-cycle handler (1m)

Above the JSX return, type:

```tsx
// Cycle priority on click: low -> medium -> high -> low
async function handlePriorityClick(e: React.MouseEvent) {
```

→ Copilot writes:
- `e.stopPropagation()` (so clicking the badge doesn't open the task detail modal — *huge* talking point about context awareness)
- The cycle ternary (`low → medium → high → low`)
- The `updateTaskPriority` call
- An optimistic state update via the `onTaskUpdated` prop

Wire it onto the badge:

```tsx
<span onClick={handlePriorityClick} className={...
```

→ Inline completion fills the rest.

**Talking point:**
> "Notice the `stopPropagation` call. Copilot saw the parent `<div>` has an `onClick` and knew the badge click would bubble — that's reading the surrounding code."

*(Note: if the `Card` component doesn't yet have `onTaskUpdated` in its props, add it manually or accept Copilot's suggestion to add it. Keep it simple — local-only update is fine for the demo.)*

---

## Step 6 — Show it work (45s)

1. Save all files. Vite hot-reloads.
2. Switch to the browser. Each card now shows a colored pill — gray, amber, or red.
3. Click a pill. Watch the color cycle.
4. Refresh the page. The new color persists (proof the API call worked).

---

## Closing line

> "Chat mode got me 80% of the backend in 30 seconds. Inline mode got me 80% of the UI by writing four comments and pressing Tab. Different superpowers — same Copilot."

---

## When inline shines vs. when to switch to Chat

| Use **inline** when... | Use **Chat** when... |
|---|---|
| You know the shape of the next line | You need a multi-file scaffold |
| You're filling in a known pattern | You need to explain the change in prose first |
| You want to stay in flow | You want to review a diff before accepting |
| The change is local to one function | The change spans schema + API + UI |

---

## Troubleshooting during the demo

| Issue | Fix |
|---|---|
| No inline suggestion appears | Click in the editor to focus, wait ~500ms, or press `Alt+\` to force a suggestion. |
| Suggestion is wrong | Press `Alt+]` / `Alt+[` to cycle alternatives, or accept word-by-word with `Ctrl+Right`. |
| Badge appears but click does nothing | Check the network tab — confirm `PATCH /api/tasks/:id/priority` returns 200. If 404, the backend scaffold wasn't applied. |
| TypeScript error on `task.priority` | The `Task` interface update from Step 2 wasn't saved. Save `types.ts` and the editor re-checks. |
