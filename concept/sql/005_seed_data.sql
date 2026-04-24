-- =============================================================================
-- 005_seed_data.sql
-- Taskify — Seed data for development / demo environment
-- Fixed UUIDs ensure idempotent re-runs and stable FK references.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Users
-- a0000000-0000-0000-0000-00000000000X
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, role, avatar_color) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Sarah Chen',   'product manager', '#6366f1'),
    ('a0000000-0000-0000-0000-000000000002', 'Alex Rivera',  'engineer',        '#10b981'),
    ('a0000000-0000-0000-0000-000000000003', 'Jordan Kim',   'engineer',        '#f59e0b'),
    ('a0000000-0000-0000-0000-000000000004', 'Morgan Lee',   'engineer',        '#ef4444'),
    ('a0000000-0000-0000-0000-000000000005', 'Taylor Patel', 'engineer',        '#8b5cf6')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Projects
-- b0000000-0000-0000-0000-00000000000X
-- -----------------------------------------------------------------------------
INSERT INTO projects (id, name, description) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Website Redesign', 'Modernize the company website with a fresh design and improved UX'),
    ('b0000000-0000-0000-0000-000000000002', 'Mobile App MVP',   'Build the minimum viable product for the mobile application'),
    ('b0000000-0000-0000-0000-000000000003', 'API Integration',  'Integrate third-party APIs for payment processing and notifications')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Tasks
-- c0000000-0000-0000-0000-00000000000X
-- -----------------------------------------------------------------------------

-- Website Redesign tasks
INSERT INTO tasks (id, project_id, title, status, position, assigned_user_id) VALUES
    ('c0000000-0000-0000-0000-000000000001',
        'b0000000-0000-0000-0000-000000000001',
        'Design new homepage layout',
        'todo', 0,
        'a0000000-0000-0000-0000-000000000003'),  -- Jordan Kim

    ('c0000000-0000-0000-0000-000000000002',
        'b0000000-0000-0000-0000-000000000001',
        'Implement responsive navigation bar',
        'in_progress', 0,
        'a0000000-0000-0000-0000-000000000002'),  -- Alex Rivera

    ('c0000000-0000-0000-0000-000000000003',
        'b0000000-0000-0000-0000-000000000001',
        'ensure ci/cd pipelines exist',
        'in_review', 0,
        NULL),                                    -- unassigned

    ('c0000000-0000-0000-0000-000000000004',
        'b0000000-0000-0000-0000-000000000001',
        'Refactor CSS to Tailwind',
        'done', 0,
        'a0000000-0000-0000-0000-000000000004')   -- Morgan Lee
ON CONFLICT (id) DO NOTHING;

-- Mobile App MVP tasks
INSERT INTO tasks (id, project_id, title, status, position, assigned_user_id) VALUES
    ('c0000000-0000-0000-0000-000000000005',
        'b0000000-0000-0000-0000-000000000002',
        'Create onboarding flow',
        'todo', 0,
        NULL),                                    -- unassigned (required by tests)

    ('c0000000-0000-0000-0000-000000000006',
        'b0000000-0000-0000-0000-000000000002',
        'Design push notification system',
        'in_progress', 0,
        'a0000000-0000-0000-0000-000000000005'),  -- Taylor Patel

    ('c0000000-0000-0000-0000-000000000007',
        'b0000000-0000-0000-0000-000000000002',
        'Implement offline mode',
        'todo', 1,
        NULL)                                     -- unassigned
ON CONFLICT (id) DO NOTHING;

-- API Integration tasks
INSERT INTO tasks (id, project_id, title, status, position, assigned_user_id) VALUES
    ('c0000000-0000-0000-0000-000000000008',
        'b0000000-0000-0000-0000-000000000003',
        'Set up Stripe payment integration',
        'todo', 0,
        'a0000000-0000-0000-0000-000000000002'),  -- Alex Rivera

    ('c0000000-0000-0000-0000-000000000009',
        'b0000000-0000-0000-0000-000000000003',
        'Integrate SendGrid email service',
        'in_progress', 0,
        'a0000000-0000-0000-0000-000000000003'),  -- Jordan Kim

    ('c0000000-0000-0000-0000-000000000010',
        'b0000000-0000-0000-0000-000000000003',
        'Write API documentation',
        'in_review', 0,
        NULL)                                     -- unassigned
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Comments (on "Design new homepage layout" task)
-- d0000000-0000-0000-0000-00000000000X
-- -----------------------------------------------------------------------------
INSERT INTO comments (id, task_id, user_id, content) VALUES
    ('d0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',   -- Sarah Chen
        'This needs to be modern and clean. Let''s use a grid layout.'),

    ('d0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000003',   -- Jordan Kim
        'I''ll start with wireframes this week.')
ON CONFLICT (id) DO NOTHING;
