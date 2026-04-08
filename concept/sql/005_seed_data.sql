-- =============================================================================
-- Taskify - Seed Data
-- =============================================================================
-- Populates the database with sample data for development and demonstration.
--
-- Contents:
--   - 5 users (1 Product Manager, 4 Engineers)
--   - 3 projects
--   - 12 tasks (4 per project, distributed across all 4 Kanban columns)
--   - Sample comments to demonstrate threaded discussion
--
-- This script uses fixed UUIDs so that references between tables are
-- deterministic and the script is idempotent (re-runnable).
--
-- Execution:
--   Local (Docker):  Automatically executed on first container startup.
--   Azure:           Manually executed after 001_create_tables.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT INTO users (id, name, role, avatar_color) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Sarah Chen',   'product_manager', '#8B5CF6'),
    ('a2222222-2222-2222-2222-222222222222', 'Alex Rivera',  'engineer',        '#3B82F6'),
    ('a3333333-3333-3333-3333-333333333333', 'Jordan Kim',   'engineer',        '#10B981'),
    ('a4444444-4444-4444-4444-444444444444', 'Morgan Lee',   'engineer',        '#F59E0B'),
    ('a5555555-5555-5555-5555-555555555555', 'Taylor Patel', 'engineer',        '#EF4444')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
INSERT INTO projects (id, name, description) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'Website Redesign',  'Modernize the company website with a fresh design and improved UX'),
    ('b2222222-2222-2222-2222-222222222222', 'Mobile App MVP',    'Build the minimum viable product for the mobile application'),
    ('b3333333-3333-3333-3333-333333333333', 'API Integration',   'Integrate third-party APIs for payment processing and notifications')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tasks - Website Redesign (4 tasks, 1 per column)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, project_id, title, description, status, position, assigned_user_id) VALUES
    ('c1111111-1111-1111-1111-111111111111',
     'b1111111-1111-1111-1111-111111111111',
     'Design new homepage layout',
     'Create wireframes and mockups for the new homepage with improved navigation and hero section.',
     'todo', 0,
     'a3333333-3333-3333-3333-333333333333'),

    ('c1111111-1111-1111-1111-222222222222',
     'b1111111-1111-1111-1111-111111111111',
     'Implement responsive navigation bar',
     'Build the top navigation component with dropdown menus and mobile hamburger fallback.',
     'in_progress', 0,
     'a2222222-2222-2222-2222-222222222222'),

    ('c1111111-1111-1111-1111-333333333333',
     'b1111111-1111-1111-1111-111111111111',
     'Refactor CSS to Tailwind',
     'Migrate existing custom CSS to Tailwind utility classes for consistency.',
     'in_review', 0,
     'a4444444-4444-4444-4444-444444444444'),

    ('c1111111-1111-1111-1111-444444444444',
     'b1111111-1111-1111-1111-111111111111',
     'Set up CI/CD pipeline',
     'Configure GitHub Actions for automated build, test, and deploy to staging.',
     'done', 0,
     'a5555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tasks - Mobile App MVP (4 tasks, 1 per column)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, project_id, title, description, status, position, assigned_user_id) VALUES
    ('c2222222-2222-2222-2222-111111111111',
     'b2222222-2222-2222-2222-222222222222',
     'Create onboarding flow',
     'Design and implement the first-time user onboarding screens with swipeable tutorial.',
     'todo', 0,
     NULL),

    ('c2222222-2222-2222-2222-222222222222',
     'b2222222-2222-2222-2222-222222222222',
     'Build push notification service',
     'Implement Firebase Cloud Messaging integration for real-time push notifications.',
     'in_progress', 0,
     'a4444444-4444-4444-4444-444444444444'),

    ('c2222222-2222-2222-2222-333333333333',
     'b2222222-2222-2222-2222-222222222222',
     'User profile screen',
     'Build the user profile view with avatar upload and settings management.',
     'in_review', 0,
     'a3333333-3333-3333-3333-333333333333'),

    ('c2222222-2222-2222-2222-444444444444',
     'b2222222-2222-2222-2222-222222222222',
     'Set up React Native project',
     'Initialize React Native project with TypeScript, navigation, and state management.',
     'done', 0,
     'a2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Tasks - API Integration (4 tasks, 1 per column)
-- ---------------------------------------------------------------------------
INSERT INTO tasks (id, project_id, title, description, status, position, assigned_user_id) VALUES
    ('c3333333-3333-3333-3333-111111111111',
     'b3333333-3333-3333-3333-333333333333',
     'Research payment gateway options',
     'Evaluate Stripe, PayPal, and Square APIs for integration feasibility and pricing.',
     'todo', 0,
     'a1111111-1111-1111-1111-111111111111'),

    ('c3333333-3333-3333-3333-222222222222',
     'b3333333-3333-3333-3333-333333333333',
     'Implement Stripe checkout flow',
     'Build server-side Stripe integration with checkout sessions and webhook handlers.',
     'in_progress', 0,
     'a5555555-5555-5555-5555-555555555555'),

    ('c3333333-3333-3333-3333-333333333333',
     'b3333333-3333-3333-3333-333333333333',
     'Write API documentation',
     'Document all REST endpoints with request/response examples using OpenAPI spec.',
     'in_review', 0,
     'a1111111-1111-1111-1111-111111111111'),

    ('c3333333-3333-3333-3333-444444444444',
     'b3333333-3333-3333-3333-333333333333',
     'Define API authentication strategy',
     'Design OAuth 2.0 token-based authentication flow for third-party API consumers.',
     'done', 0,
     'a2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Comments - Sample threaded discussion
-- ---------------------------------------------------------------------------

-- Top-level comment on "Design new homepage layout"
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    ('d1111111-1111-1111-1111-111111111111',
     'c1111111-1111-1111-1111-111111111111',
     'a1111111-1111-1111-1111-111111111111',
     NULL,
     'Let us prioritize the hero section and call-to-action placement. I have some competitor analysis to share.')
ON CONFLICT (id) DO NOTHING;

-- Reply to the above comment
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    ('d1111111-1111-1111-1111-222222222222',
     'c1111111-1111-1111-1111-111111111111',
     'a3333333-3333-3333-3333-333333333333',
     'd1111111-1111-1111-1111-111111111111',
     'That would be really helpful. I will start with the wireframes once I see the analysis.')
ON CONFLICT (id) DO NOTHING;

-- Another top-level comment on same task
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    ('d1111111-1111-1111-1111-333333333333',
     'c1111111-1111-1111-1111-111111111111',
     'a2222222-2222-2222-2222-222222222222',
     NULL,
     'Should we consider A/B testing the layout? We could deploy two variants to measure engagement.')
ON CONFLICT (id) DO NOTHING;

-- Comment on "Implement responsive navigation bar"
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    ('d2222222-2222-2222-2222-111111111111',
     'c1111111-1111-1111-1111-222222222222',
     'a2222222-2222-2222-2222-222222222222',
     NULL,
     'I am about halfway done with this. The desktop version is working. Starting on the mobile hamburger menu tomorrow.')
ON CONFLICT (id) DO NOTHING;

-- Reply on navigation bar task
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    ('d2222222-2222-2222-2222-222222222222',
     'c1111111-1111-1111-1111-222222222222',
     'a4444444-4444-4444-4444-444444444444',
     'd2222222-2222-2222-2222-111111111111',
     'Nice progress! Make sure to test on Safari -- I ran into some flexbox issues there last sprint.')
ON CONFLICT (id) DO NOTHING;

-- Comment on "Implement Stripe checkout flow"
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
    ('d3333333-3333-3333-3333-111111111111',
     'c3333333-3333-3333-3333-222222222222',
     'a5555555-5555-5555-5555-555555555555',
     NULL,
     'Stripe test mode is working end-to-end. Need to add webhook signature verification before moving to review.')
ON CONFLICT (id) DO NOTHING;
