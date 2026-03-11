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

describe('GET /api/projects', () => {
  it('returns a list of projects with task counts', async () => {
    const projects = [
      { id: 'p1', name: 'Project A', description: 'Desc A', task_count: 5, done_count: 2, created_at: '2024-01-01', updated_at: '2024-01-02' },
      { id: 'p2', name: 'Project B', description: 'Desc B', task_count: 3, done_count: 0, created_at: '2024-01-03', updated_at: '2024-01-04' }
    ];
    mockPool.query.mockResolvedValueOnce({ rows: projects });

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(projects);
    expect(res.body).toHaveLength(2);
  });

  it('returns 500 on database error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB unavailable'));

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });
});

describe('GET /api/projects/:id', () => {
  it('returns a single project when found', async () => {
    const project = { id: 'p1', name: 'Project A', description: 'Desc A', created_at: '2024-01-01', updated_at: '2024-01-02' };
    mockPool.query.mockResolvedValueOnce({ rows: [project] });

    const res = await request(app).get('/api/projects/p1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(project);
  });

  it('returns 404 when project not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/projects/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Project not found');
  });
});

describe('POST /api/projects', () => {
  it('creates a project with name and description', async () => {
    const created = { id: 'p1', name: 'New Project', description: 'A description', created_at: '2024-01-01', updated_at: '2024-01-01' };
    mockPool.query.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'New Project', description: 'A description' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  it('returns 201 status code on creation', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'p1', name: 'Test' }] });

    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Test' });

    expect(res.status).toBe(201);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ description: 'No name' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Project name is required');
  });

  it('returns 400 when name is empty string', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Project name is required');
  });

  it('returns 400 when name is whitespace only', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Project name is required');
  });

  it('trims whitespace from name', async () => {
    const created = { id: 'p1', name: 'Trimmed', description: null };
    mockPool.query.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post('/api/projects')
      .send({ name: '  Trimmed  ' });

    expect(res.status).toBe(201);
    // Verify the query was called with the trimmed name
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.any(String),
      ['Trimmed', null]
    );
  });
});
