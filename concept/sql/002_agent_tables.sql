-- =============================================================================
-- Taskify - Agent Tables & Task Decomposition Schema
-- =============================================================================
-- Adds parent_task_id for subtask hierarchy and task_jobs for agent processing.
-- =============================================================================

-- Add parent_task_id to tasks for subtask relationships
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Task Jobs table for agent processing
CREATE TABLE IF NOT EXISTS task_jobs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID            NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id      UUID            NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    job_type        TEXT            NOT NULL DEFAULT 'decompose',
    status          TEXT            NOT NULL DEFAULT 'pending',
    result          JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_task_jobs_status ON task_jobs(status);
CREATE INDEX IF NOT EXISTS idx_task_jobs_task_id ON task_jobs(task_id);
