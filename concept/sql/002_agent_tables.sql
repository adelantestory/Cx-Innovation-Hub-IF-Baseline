-- =============================================================================
-- Taskify — Smart Task Decomposition Tables
-- =============================================================================
-- Adds the subtasks table that enables the Smart Task Decomposition feature:
-- users can break a parent task into ordered, checkable subtasks.
-- Run order: 001 → 002 (this file) → 005
-- =============================================================================

-- Subtasks table — ordered checklist items belonging to a parent task
CREATE TABLE IF NOT EXISTS subtasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  position     INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
