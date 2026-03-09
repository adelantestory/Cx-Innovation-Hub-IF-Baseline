# Taskify — UI Navigation Flow

> **Auto-generated** from Playwright-validated navigation analysis of the Taskify web application.

## Application Overview

Taskify is a Kanban-style project management app with **state-based navigation** (no router).  
The UI consists of **3 views** and **1 modal overlay**, connected by user-driven actions.

---

## Navigation Flow Diagram

```mermaid
graph LR
    %% ── Screens ──────────────────────────────────────────────
    LOGIN(["🏠 User Selection<br/><i>Pick your identity</i>"])
    PROJECTS(["📁 Project List<br/><i>Browse &amp; create projects</i>"])
    BOARD(["📋 Kanban Board<br/><i>Manage tasks across columns</i>"])
    DETAIL(["📝 Task Detail<br/><i>Edit, assign &amp; discuss</i>"])

    %% ── Kanban Columns (sub-states) ──────────────────────────
    TODO["To Do"]
    INPROG["In Progress"]
    REVIEW["In Review"]
    DONE["Done"]

    %% ── Actions within Task Detail ───────────────────────────
    EDIT["Edit Title &amp;<br/>Description"]
    ASSIGN["Assign /<br/>Reassign User"]
    DELETE_TASK["Delete Task"]
    COMMENTS["Threaded<br/>Comments"]

    %% ── Inline Forms ─────────────────────────────────────────
    NEWPROJ["New Project<br/>Form"]
    NEWTASK["New Task<br/>Form"]

    %% ── Primary navigation flow ──────────────────────────────
    LOGIN -->|"Select User"| PROJECTS
    PROJECTS -->|"Click Project"| BOARD
    BOARD -->|"Click Task Card"| DETAIL

    %% ── Back navigation ──────────────────────────────────────
    PROJECTS -.->|"Switch User"| LOGIN
    BOARD -.->|"← Projects"| PROJECTS
    DETAIL -.->|"Close (✕)"| BOARD

    %% ── Header navigation (always visible) ───────────────────
    BOARD -.->|"Taskify Logo"| PROJECTS
    PROJECTS -.->|"Taskify Logo"| PROJECTS

    %% ── Inline form flows ────────────────────────────────────
    PROJECTS -->|"New Project"| NEWPROJ
    NEWPROJ -->|"Create"| PROJECTS
    BOARD -->|"+ New Task"| NEWTASK
    NEWTASK -->|"Add"| BOARD

    %% ── Kanban columns (drag-and-drop) ───────────────────────
    BOARD --- TODO
    BOARD --- INPROG
    BOARD --- REVIEW
    BOARD --- DONE
    TODO <-->|"Drag &amp; Drop"| INPROG
    INPROG <-->|"Drag &amp; Drop"| REVIEW
    REVIEW <-->|"Drag &amp; Drop"| DONE

    %% ── Task Detail actions ──────────────────────────────────
    DETAIL --- EDIT
    DETAIL --- ASSIGN
    DETAIL --- DELETE_TASK
    DETAIL --- COMMENTS
    DELETE_TASK -->|"Confirm"| BOARD

    %% ── Styling ──────────────────────────────────────────────
    classDef screen fill:#3B82F6,stroke:#1E40AF,color:#FFFFFF,rx:12
    classDef modal fill:#8B5CF6,stroke:#5B21B6,color:#FFFFFF,rx:12
    classDef column fill:#F0F9FF,stroke:#93C5FD,color:#1E3A5F,rx:6
    classDef action fill:#ECFDF5,stroke:#6EE7B7,color:#065F46,rx:6
    classDef form fill:#FFF7ED,stroke:#FDBA74,color:#7C2D12,rx:6

    class LOGIN,PROJECTS,BOARD screen
    class DETAIL modal
    class TODO,INPROG,REVIEW,DONE column
    class EDIT,ASSIGN,DELETE_TASK,COMMENTS action
    class NEWPROJ,NEWTASK form
```

---

## Navigation Legend

| Color | Meaning | Examples |
|-------|---------|----------|
| 🔵 **Blue** | Main screens / views | User Selection, Project List, Kanban Board |
| 🟣 **Purple** | Modal overlays | Task Detail |
| 🔷 **Light Blue** | Kanban columns (sub-states) | To Do, In Progress, In Review, Done |
| 🟢 **Green** | In-modal actions | Edit, Assign, Delete, Comments |
| 🟠 **Orange** | Inline forms | New Project, New Task |
| **Solid arrow** →  | Forward navigation | Select User → Projects |
| **Dashed arrow** ⇢ | Back / return navigation | ← Projects, Switch User, Close |
| **Double arrow** ↔ | Bidirectional interaction | Drag & Drop between columns |

## Screen Details

### 1. User Selection (Landing)
- Displays 5 user cards with avatar, name, and role
- No header bar — standalone full-page view
- Selecting a user sets the active identity (no authentication)

### 2. Project List
- **Header**: Taskify logo (home link) · User avatar + name · Switch User
- Project cards in a responsive grid (1–3 columns)
- Each card shows: name, description, task count, done count
- "New Project" button toggles an inline creation form

### 3. Kanban Board
- **Header**: Same persistent header as Project List
- **Sub-header**: ← Projects back link · Project name · + New Task button
- **4 columns**: To Do → In Progress → In Review → Done
- Cards are **draggable** between columns (optimistic update)
- Clicking any card opens the Task Detail modal

### 4. Task Detail (Modal)
- Overlay on top of the Kanban Board (board remains visible behind scrim)
- **Status badge** · Title (click-to-edit) · Description (click-to-edit)
- **Assignee dropdown** with all team members
- **Actions**: Edit Task · Delete Task (with confirmation)
- **Threaded comments**: Add, reply (2 levels), edit (author), delete (author)
