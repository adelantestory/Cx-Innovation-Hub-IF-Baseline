-- =============================================================================
-- Taskify - Database Schema
-- =============================================================================
-- Creates all tables, constraints, and indexes for the Taskify application.
-- Compatible with PostgreSQL 16 (Azure Database for PostgreSQL Flexible Server).
--
-- Execution:
--   Local (Docker):  Automatically executed on first container startup via
--                    /docker-entrypoint-initdb.d/ mount.
--   Azure:           Manually executed by deploying user against the
--                    PostgreSQL Flexible Server after provisioning.
--
-- Dependencies: pgcrypto extension (for gen_random_uuid)
-- =============================================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Users Table
-- Five predefined team members. No dynamic user creation in this prototype.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT            NOT NULL,
    role            TEXT            NOT NULL,
    avatar_color    TEXT            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Projects Table
-- Kanban project boards. Pre-seeded with three sample projects.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT            NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Tasks Table
-- Task cards within projects. Status determines Kanban column placement.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title               TEXT        NOT NULL,
    description         TEXT,
    status              TEXT        NOT NULL DEFAULT 'todo',
    position            INTEGER     NOT NULL DEFAULT 0,
    assigned_user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Comments Table
-- Threaded comments on task cards with ownership-based edit/delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id             UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id   UUID        REFERENCES comments(id) ON DELETE CASCADE,
    content             TEXT        NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_project_id            ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user_id      ON tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status                ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_comments_task_id            ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id            ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id  ON comments(parent_comment_id);
