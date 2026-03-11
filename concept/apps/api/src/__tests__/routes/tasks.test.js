const { mockPool, resetMocks, setupDatabaseMock } = require('../helpers/mockDatabase');
setupDatabaseMock();

const { createTestApp } = require('../helpers/testApp');
const request = require('supertest');

let app;

beforeAll(() => {
  app = createTestApp();
});

beforeEach(() => {
  resetMocks();
});

describe('GET /api/projects/:projectId/tasks', () => {
  it('returns tasks with user details', async () => {
    const tasks = [
      {
        id: 't1', project_id: 'p1', title: 'Task 1', description: 'Desc',
        status: 'todo', position: 0, assigned_user_id: 'u1',
        created_at: '2024-01-01', updated_at: '2024-01-01',
        assigned_user_name: 'Alice', assigned_user_avatar_color: '#ff0000'
      },
      {
        id: 't2', project_id: 'p1', title: 'Task 2', description: null,
        status: 'done', position: 1, assigned_user_id: null,
        created_at: '2024-01-02', updated_at: '2024-01-02',
        assigned_user_name: null, assigned_user_avatar_color: null
      }
    ];
    mockPool.query.mockResolvedValueOnce({ rows: tasks });

    const res = await request(app).get('/api/projects/p1/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(tasks);
    expect(res.body).toHaveLength(2);
  });

  it('returns empty array when project has no tasks', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/projects/p1/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/projects/p1/tasks');

    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });
});

describe('POST /api/projects/:projectId/tasks', () => {
  it('creates a task and returns 201 with user details', async () => {
    // 1st query: get next position
    mockPool.query.mockResolvedValueOnce({ rows: [{ next_pos: 0 }] });
    // 2nd query: INSERT RETURNING *
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', project_id: 'p1', title: 'New Task' }] });
    // 3rd query: fetch with user JOIN
    const taskWithUser = {
      id: 't1', project_id: 'p1', title: 'New Task', description: null,
      status: 'todo', position: 0, assigned_user_id: null,
      assigned_user_name: null, assigned_user_avatar_color: null
    };
    mockPool.query.mockResolvedValueOnce({ rows: [taskWithUser] });

    const res = await request(app)
      .post('/api/projects/p1/tasks')
      .send({ title: 'New Task' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(taskWithUser);
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/projects/p1/tasks')
      .send({ description: 'No title' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Task title is required');
  });

  it('returns 400 when title is empty', async () => {
    const res = await request(app)
      .post('/api/projects/p1/tasks')
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Task title is required');
  });

  it('returns 400 when title is whitespace only', async () => {
    const res = await request(app)
      .post('/api/projects/p1/tasks')
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Task title is required');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates task title and description', async () => {
    // 1st query: UPDATE RETURNING *
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', title: 'Updated', description: 'New desc' }] });
    // 2nd query: fetch with user JOIN
    const updated = {
      id: 't1', title: 'Updated', description: 'New desc',
      assigned_user_name: 'Alice', assigned_user_avatar_color: '#ff0000'
    };
    mockPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put('/api/tasks/t1')
      .send({ title: 'Updated', description: 'New desc' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('returns 404 when task not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/tasks/nonexistent')
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Task not found');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app)
      .put('/api/tasks/t1')
      .send({ description: 'No title' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Task title is required');
  });

  it('returns 400 when title is empty', async () => {
    const res = await request(app)
      .put('/api/tasks/t1')
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Task title is required');
  });
});

describe('PATCH /api/tasks/:id/status', () => {
  it('updates status and position', async () => {
    // 1st query: UPDATE RETURNING *
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', status: 'in_progress', position: 2 }] });
    // 2nd query: fetch with user JOIN
    const updated = {
      id: 't1', status: 'in_progress', position: 2,
      assigned_user_name: null, assigned_user_avatar_color: null
    };
    mockPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/api/tasks/t1/status')
      .send({ status: 'in_progress', position: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('validates status is one of the allowed values', async () => {
    const res = await request(app)
      .patch('/api/tasks/t1/status')
      .send({ status: 'invalid_status', position: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid status');
    expect(res.body.error.message).toContain('todo');
    expect(res.body.error.message).toContain('in_progress');
    expect(res.body.error.message).toContain('in_review');
    expect(res.body.error.message).toContain('done');
  });

  it('returns 400 when status is missing', async () => {
    const res = await request(app)
      .patch('/api/tasks/t1/status')
      .send({ position: 0 });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid status');
  });

  it('returns 400 when position is missing', async () => {
    const res = await request(app)
      .patch('/api/tasks/t1/status')
      .send({ status: 'todo' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Position is required');
  });

  it('returns 404 when task not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/tasks/nonexistent/status')
      .send({ status: 'done', position: 0 });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Task not found');
  });

  it('accepts position of 0', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', status: 'todo', position: 0 }] });
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', status: 'todo', position: 0 }] });

    const res = await request(app)
      .patch('/api/tasks/t1/status')
      .send({ status: 'todo', position: 0 });

    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/tasks/:id/assign', () => {
  it('assigns a user to a task', async () => {
    // 1st query: UPDATE RETURNING *
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', assigned_user_id: 'u1' }] });
    // 2nd query: fetch with user JOIN
    const updated = {
      id: 't1', assigned_user_id: 'u1',
      assigned_user_name: 'Alice', assigned_user_avatar_color: '#ff0000'
    };
    mockPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/api/tasks/t1/assign')
      .send({ assigned_user_id: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.assigned_user_id).toBe('u1');
    expect(res.body.assigned_user_name).toBe('Alice');
  });

  it('unassigns user when assigned_user_id is null', async () => {
    // 1st query: UPDATE RETURNING *
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1', assigned_user_id: null }] });
    // 2nd query: fetch with user JOIN
    const updated = {
      id: 't1', assigned_user_id: null,
      assigned_user_name: null, assigned_user_avatar_color: null
    };
    mockPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .patch('/api/tasks/t1/assign')
      .send({ assigned_user_id: null });

    expect(res.status).toBe(200);
    expect(res.body.assigned_user_id).toBeNull();
    expect(res.body.assigned_user_name).toBeNull();
  });

  it('returns 404 when task not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/tasks/nonexistent/assign')
      .send({ assigned_user_id: 'u1' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Task not found');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns message', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 't1' }] });

    const res = await request(app).delete('/api/tasks/t1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task deleted');
    expect(res.body.id).toBe('t1');
  });

  it('returns 404 when task not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).delete('/api/tasks/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Task not found');
  });

  it('returns 500 on database error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).delete('/api/tasks/t1');

    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });
});
