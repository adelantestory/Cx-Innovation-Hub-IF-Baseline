// =============================================================================
// Board.tsx — STUB FOR FIGMA MCP DEMO
// =============================================================================
// This component is intentionally incomplete.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  TODO: Implement using the Figma design                                 │
// │                                                                         │
// │  Figma Frame: Taskify / Kanban Board                                    │
// │  Connect Figma MCP in VS Code Copilot, then use the prompt below.       │
// │                                                                         │
// │  Design Tokens (from Figma):                                            │
// │  --board-bg:        #F8FAFC                                             │
// │  --column-bg:       #F1F5F9                                             │
// │  --column-border:   #E2E8F0                                             │
// │  --column-width:    280px                                               │
// │  --column-gap:      16px                                                │
// │  --card-bg:         #FFFFFF                                             │
// │  --card-mine-bg:    #EFF6FF   (cards assigned to currentUser)           │
// │  --card-mine-border:#BFDBFE                                             │
// │  --drop-zone-bg:    #DBEAFE   (column highlight during drag-over)       │
// └─────────────────────────────────────────────────────────────────────────┘
//
// Component API (do not change — imported by App.tsx):
//   interface BoardProps {
//     project: Project;
//     currentUser: User;
//     onBack: () => void;
//   }
//
// Available sub-components (already implemented):
//   - Column.tsx   — renders one kanban column with a droppable zone
//   - Card.tsx     — renders one task card with drag handle
//   - TaskDetail.tsx — modal for task detail, comments, assignment
//
// Available API functions (from ../../api/client):
//   fetchTasks(projectId), fetchUsers(), createTask(projectId, data),
//   updateTaskStatus(taskId, status, position)
//
// STATUS_COLUMNS from ../../api/types:
//   ['todo', 'in_progress', 'in_review', 'done']
//
// Drag-and-drop: @hello-pangea/dnd (DragDropContext, DropResult)
// =============================================================================

import type { Project, User } from "../../api/types";

interface BoardProps {
  project: Project;
  currentUser: User;
  onBack: () => void;
}

// Placeholder — replace this entire component with the Figma-accurate version
export default function Board({ project, onBack }: BoardProps) {
  return (
    <div className="p-8 text-center">
      <button onClick={onBack} className="text-sm text-gray-500 mb-4 block">
        ← Projects
      </button>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h2>
      <p className="text-gray-500 text-sm">
        Board not yet implemented — use Figma MCP + Copilot to generate this component.
      </p>
    </div>
  );
}
