-- =============================================================================
-- Taskify — Seed Data
-- =============================================================================
-- Inserts the 5 predefined users, 3 projects, sample tasks, and sample
-- comments. Uses fixed UUIDs so re-runs produce consistent IDs.
-- Run order: 001 → 002 → 005 (this file)
-- =============================================================================

-- ── Users ────────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, role, avatar_color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sarah Chen',    'Product Manager', '#6366f1'),
  ('22222222-2222-2222-2222-222222222222', 'Alex Rivera',   'Engineer',        '#10b981'),
  ('33333333-3333-3333-3333-333333333333', 'Jordan Kim',    'Engineer',        '#f59e0b'),
  ('44444444-4444-4444-4444-444444444444', 'Taylor Morgan', 'Engineer',        '#ef4444'),
  ('55555555-5555-5555-5555-555555555555', 'Casey Davis',   'Engineer',        '#8b5cf6')
ON CONFLICT (id) DO NOTHING;

-- ── Projects ─────────────────────────────────────────────────────────────────
INSERT INTO projects (id, name, description) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mobile App Redesign',        'Redesign the mobile application with improved UX and performance.'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'API Performance Initiative', 'Optimize backend API response times and reduce N+1 query patterns.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Platform Security Audit',   'Comprehensive security review and remediation across all services.')
ON CONFLICT (id) DO NOTHING;

-- ── Tasks ─────────────────────────────────────────────────────────────────────
INSERT INTO tasks (id, project_id, title, description, status, position, assigned_user_id) VALUES
  -- Mobile App Redesign
  ('t1000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Design new onboarding flow', 'Create wireframes and high-fidelity mockups for the updated onboarding experience.',
   'done', 0, '11111111-1111-1111-1111-111111111111'),

  ('t1000001-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Implement bottom navigation bar', 'Replace the hamburger menu with a persistent bottom navigation bar.',
   'in_progress', 0, '22222222-2222-2222-2222-222222222222'),

  ('t1000001-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Migrate to design tokens', 'Replace hardcoded colours and spacing values with design tokens.',
   'todo', 0, NULL),

  ('t1000001-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Write E2E tests for onboarding', 'Playwright tests covering the happy path and edge cases for the new onboarding flow.',
   'in_review', 0, '33333333-3333-3333-3333-333333333333'),

  -- API Performance Initiative
  ('t2000002-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Fix N+1 query in tasks list', 'Replace per-task user lookup with a single LEFT JOIN query.',
   'done', 0, '44444444-4444-4444-4444-444444444444'),

  ('t2000002-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Add pagination to tasks endpoint', 'Implement optional ?limit and ?offset query parameters.',
   'in_progress', 0, '22222222-2222-2222-2222-222222222222'),

  ('t2000002-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Add database indexes', 'Create indexes on tasks.project_id and tasks.status for faster queries.',
   'todo', 0, '55555555-5555-5555-5555-555555555555'),

  -- Platform Security Audit
  ('t3000003-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'SQL injection audit', 'Review all parameterised queries and eliminate any string concatenation in SQL.',
   'in_review', 0, '33333333-3333-3333-3333-333333333333'),

  ('t3000003-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Add rate limiting to API', 'Implement per-IP rate limiting on all public endpoints.',
   'todo', 0, NULL),

  ('t3000003-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Enable HTTPS-only policy', 'Configure SSL/TLS and enforce HTTPS redirects across all services.',
   'todo', 1, '44444444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- ── Comments ──────────────────────────────────────────────────────────────────
INSERT INTO comments (id, task_id, user_id, parent_comment_id, content) VALUES
  ('c0000001-0000-0000-0000-000000000001',
   't1000001-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111',
   NULL,
   'Onboarding mockups approved in the design review. Handing off to engineering.'),

  ('c0000001-0000-0000-0000-000000000002',
   't1000001-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-222222222222',
   'c0000001-0000-0000-0000-000000000001',
   'Thanks! Starting implementation this sprint.'),

  ('c0000002-0000-0000-0000-000000000001',
   't2000002-0000-0000-0000-000000000002',
   '22222222-2222-2222-2222-222222222222',
   NULL,
   'Should we default to limit=20 or return all if the param is omitted?'),

  ('c0000002-0000-0000-0000-000000000002',
   't2000002-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111',
   'c0000002-0000-0000-0000-000000000001',
   'Return all by default for backward compatibility. Add limit/offset as optional params.'),

  ('c0000003-0000-0000-0000-000000000001',
   't3000003-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333',
   NULL,
   'Found two instances of string concatenation in legacy scripts. Opened sub-tickets.')
ON CONFLICT (id) DO NOTHING;

-- ── Sample subtasks for the Smart Task Decomposition demo ────────────────────
INSERT INTO subtasks (id, task_id, title, is_completed, position) VALUES
  ('s0000001-0000-0000-0000-000000000001',
   't1000001-0000-0000-0000-000000000002',
   'Add BottomNav component', FALSE, 0),

  ('s0000001-0000-0000-0000-000000000002',
   't1000001-0000-0000-0000-000000000002',
   'Wire navigation items to routes', FALSE, 1),

  ('s0000001-0000-0000-0000-000000000003',
   't1000001-0000-0000-0000-000000000002',
   'Remove hamburger menu', FALSE, 2),

  ('s0000002-0000-0000-0000-000000000001',
   't2000002-0000-0000-0000-000000000002',
   'Add limit query param', TRUE, 0),

  ('s0000002-0000-0000-0000-000000000002',
   't2000002-0000-0000-0000-000000000002',
   'Add offset query param', FALSE, 1),

  ('s0000002-0000-0000-0000-000000000003',
   't2000002-0000-0000-0000-000000000002',
   'Update API docs', FALSE, 2)
ON CONFLICT (id) DO NOTHING;
