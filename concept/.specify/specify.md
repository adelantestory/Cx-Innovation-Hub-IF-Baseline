# Specifications: Taskify -- Team Productivity Platform

## Overview

Taskify is a Kanban-style team productivity platform that enables predefined team members to manage tasks across projects using visual boards with drag-and-drop functionality. The prototype demonstrates core task management, assignment, and collaboration features deployed on Azure using Container Apps and PostgreSQL.

---

## Functional Specifications

### Feature: User Selection (Landing Screen)

**Description**: A landing screen that displays five predefined users, allowing selection of an active identity without authentication.

**Acceptance Criteria**:
- [ ] Five predefined users are displayed with avatar icons
- [ ] Users are categorized: 1 Product Manager, 4 Engineers
- [ ] Clicking a user sets them as the active user and navigates to the project list
- [ ] A "Switch User" option is available from within the application to return to the landing screen
- [ ] No password or authentication is required

**Users (placeholder names)**:
| Name | Role |
|------|------|
| Sarah Chen | Product Manager |
| Alex Rivera | Engineer |
| Jordan Kim | Engineer |
| Morgan Lee | Engineer |
| Taylor Patel | Engineer |

---

### Feature: Project Management

**Description**: A project list view displaying available projects. Users can view existing projects and create new ones.

**Acceptance Criteria**:
- [ ] Three pre-seeded sample projects are displayed on initial load
- [ ] Each project displays its name and description
- [ ] Clicking a project opens its Kanban board
- [ ] Users can create new projects by providing a name and description
- [ ] Newly created projects appear in the project list immediately

**Sample Projects (placeholder names)**:
| Project | Description |
|---------|-------------|
| Website Redesign | Modernize the company website with a fresh design and improved UX |
| Mobile App MVP | Build the minimum viable product for the mobile application |
| API Integration | Integrate third-party APIs for payment processing and notifications |

---

### Feature: Kanban Board

**Description**: A board view with four standard workflow columns. Task cards can be dragged and dropped between columns.

**Acceptance Criteria**:
- [ ] Four columns displayed: To Do, In Progress, In Review, Done
- [ ] Task cards are displayed within their respective columns
- [ ] Cards can be dragged and dropped between columns
- [ ] Dropping a card in a new column places it at the top of that column
- [ ] Card ordering within a column is preserved
- [ ] Status change is persisted to the database immediately
- [ ] Columns with no tasks display as empty (no placeholder text)

**Kanban Columns**:
| Column | Order |
|--------|-------|
| To Do | 1 |
| In Progress | 2 |
| In Review | 3 |
| Done | 4 |

---

### Feature: Task Cards

**Description**: Individual task cards on the Kanban board displaying task details with the ability to view, create, edit, delete, assign, and change status.

**Acceptance Criteria**:
- [ ] Each card displays: title, assigned user (if any), and current status
- [ ] Cards assigned to the currently active user are highlighted in blue; all others are neutral/gray
- [ ] Clicking a card opens a detail view showing: title, description, status, assigned user, and comments
- [ ] Users can create new tasks from the Kanban board (task is added to the "To Do" column)
- [ ] Users can edit the task title and description
- [ ] Users can delete tasks
- [ ] Users can assign a task to any of the five predefined users, or leave it unassigned
- [ ] Task assignment is single-user only (one user at a time)
- [ ] Tasks can exist without an assigned user (unassigned)

**Seed Data**: 4 tasks per project (12 total), distributed across all four Kanban columns.

---

### Feature: Comments

**Description**: Threaded comment system on task cards allowing team collaboration.

**Acceptance Criteria**:
- [ ] Users can add comments to any task card
- [ ] Comments support threaded replies (reply to a specific comment)
- [ ] Each comment displays: author name, timestamp, and content
- [ ] Timestamps are displayed in a human-readable format (e.g., "Feb 12, 2026 3:45 PM")
- [ ] The comment author can edit their own comments
- [ ] The comment author can delete their own comments
- [ ] Users cannot edit or delete comments made by other users
- [ ] Comments are ordered chronologically within each thread
- [ ] There is no limit on the number of comments per task

---

## Non-Functional Specifications

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18+ with TypeScript, Vite, Tailwind CSS |
| Backend | Node.js with Express.js (JavaScript) |
| Database | PostgreSQL 16 (Azure Database for PostgreSQL Flexible Server) |
| Drag-and-Drop | @hello-pangea/dnd |
| Hosting | Azure Container Apps (2 separate containers: web + API) |
| IaC | Bicep |

### Security
- **Authentication**: No user authentication for this prototype (user selection only)
- **Database Credentials**: PostgreSQL admin password stored in Azure Key Vault
- **Service Identity**: User-Assigned Managed Identity for Container App to access Key Vault
- **Transport Security**: TLS 1.2+ enforced for all connections (HTTPS for web, SSL for PostgreSQL)
- **CORS**: Backend API configured to accept requests from the frontend Container App origin

### Performance
- **Prototype scope**: No performance optimization or load testing required
- **Database**: Connection pooling via `pg` library Pool
- **Frontend**: Standard Vite build optimization (code splitting, minification)

### Data Persistence
- All data persisted in PostgreSQL across browser sessions
- No client-side caching or local storage for data persistence
- All state changes (task moves, assignments, comments) immediately written to the database

### Deployment
- **Region**: US West 3
- **Container Strategy**: 2 separate Container Apps (frontend served via Nginx, backend via Node.js)
- **Container Registry**: Azure Container Registry for image storage
- **Scaling**: Minimum 0 replicas, scale up as needed (POC defaults)

---

## API Specifications

### Base URL
`https://<backend-container-app-fqdn>/api`

### Endpoints

#### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/users | List all predefined users |
| GET | /api/users/:id | Get a single user |

#### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get a single project with tasks |
| POST | /api/projects | Create a new project |

#### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects/:projectId/tasks | List all tasks for a project |
| POST | /api/projects/:projectId/tasks | Create a new task in a project |
| PUT | /api/tasks/:id | Update a task (title, description) |
| PATCH | /api/tasks/:id/status | Update task status (column change) |
| PATCH | /api/tasks/:id/assign | Assign/unassign a user to a task |
| DELETE | /api/tasks/:id | Delete a task |

#### Comments
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/tasks/:taskId/comments | List all comments for a task (threaded) |
| POST | /api/tasks/:taskId/comments | Add a comment to a task |
| PUT | /api/comments/:id | Edit a comment (author only) |
| DELETE | /api/comments/:id | Delete a comment (author only) |

### Request/Response Headers
- `Content-Type: application/json`
- `X-User-Id: <user-uuid>` -- Identifies the active user for comment ownership checks

---

## Data Model

### Tables

#### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | TEXT | NOT NULL |
| role | TEXT | NOT NULL (product_manager, engineer) |
| avatar_color | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

#### projects
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | TEXT | NOT NULL |
| description | TEXT | |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### tasks
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| project_id | UUID | NOT NULL, FK -> projects(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| description | TEXT | |
| status | TEXT | NOT NULL, DEFAULT 'todo' (todo, in_progress, in_review, done) |
| position | INTEGER | NOT NULL, DEFAULT 0 |
| assigned_user_id | UUID | FK -> users(id) ON DELETE SET NULL, NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### comments
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| task_id | UUID | NOT NULL, FK -> tasks(id) ON DELETE CASCADE |
| user_id | UUID | NOT NULL, FK -> users(id) ON DELETE CASCADE |
| parent_comment_id | UUID | FK -> comments(id) ON DELETE CASCADE, NULLABLE |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### Indexes
- `idx_tasks_project_id` on tasks(project_id)
- `idx_tasks_assigned_user_id` on tasks(assigned_user_id)
- `idx_tasks_status` on tasks(status)
- `idx_comments_task_id` on comments(task_id)
- `idx_comments_user_id` on comments(user_id)
- `idx_comments_parent_comment_id` on comments(parent_comment_id)

---

## UI Specifications

### Color Scheme
- **Primary (active user highlight)**: Blue (#3B82F6 / Tailwind blue-500)
- **Neutral cards**: White with gray border (#E5E7EB / Tailwind gray-200)
- **Background**: Light gray (#F9FAFB / Tailwind gray-50)
- **Columns**: White background with subtle shadow

### Layout
- **Landing screen**: Centered card grid with 5 user avatars
- **Project list**: Vertical list of project cards
- **Kanban board**: Horizontal scrollable board with 4 columns
- **Task detail**: Modal or slide-out panel overlay

### Avatars
- Generated avatar icons using initials or a default avatar library
- Each user assigned a distinct color for visual differentiation

### Responsiveness
- Desktop-optimized layout (mobile responsiveness is out of scope)
- Minimum supported viewport width: 1024px
