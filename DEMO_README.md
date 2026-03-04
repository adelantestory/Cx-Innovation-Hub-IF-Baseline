# Demo Branch: Figma MCP — Design to Code
## The Gap
`concept/apps/web/src/components/kanban/Board.tsx` is a non-functional stub.
Column.tsx, Card.tsx, and TaskDetail.tsx are complete and working.
The app launches and shows the project list — but clicking a project shows the stub.

## Setup
1. Open the Taskify Figma file
2. Connect Figma MCP server in VS Code (Settings → Copilot → MCP → Add server)
3. Verify MCP appears in Copilot Chat tools list

## Copilot Prompt (with Figma MCP active)
```
Using the connected Figma design for Taskify, implement the complete Board.tsx component.

Figma frame: "Taskify / Kanban Board"

Requirements from the stub's design tokens and the existing sub-components:
- Use DragDropContext from @hello-pangea/dnd wrapping 4 Column components
- Map STATUS_COLUMNS ['todo','in_progress','in_review','done'] to display labels
  ["To Do", "In Progress", "In Review", "Done"]
- Pass currentUser to Column so Card can highlight cards assigned to currentUser
  using --card-mine-bg and --card-mine-border from the design tokens
- Column drop zones use --drop-zone-bg during onDragOver
- Implement optimistic UI for drag: update local state immediately, then
  call updateTaskStatus(), roll back on error
- Include New Task form (inline input at top of todo column or as a header button)
- Open TaskDetail modal on card click
- Match the Figma layout, spacing, column widths exactly

Replace the entire placeholder in Board.tsx. Keep the BoardProps interface unchanged.
```

## What to Show
Split screen: Figma design (left) vs VS Code (right).
As Copilot generates, show it reading Figma node properties in the MCP tool calls.
After generation: run `docker compose up` and show the visual match side-by-side.

## Reset
```bash
git checkout main && git branch -D demo/figma-mcp
bash setup-demo-branches.sh --only figma-mcp
```
