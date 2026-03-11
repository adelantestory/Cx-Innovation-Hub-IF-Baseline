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

describe('GET /api/users', () => {
  it('returns an array of users', async () => {
    const users = [
      { id: 'u1', name: 'Alice', role: 'developer', avatar_color: '#ff0000', created_at: '2024-01-01' },
      { id: 'u2', name: 'Bob', role: 'designer', avatar_color: '#00ff00', created_at: '2024-01-02' }
    ];
    mockPool.query.mockResolvedValueOnce({ rows: users });

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
    expect(res.body).toHaveLength(2);
  });

  it('returns an empty array when no users exist', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/api/users');

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.status).toBe(500);
  });
});

describe('GET /api/users/:id', () => {
  it('returns a single user when found', async () => {
    const user = { id: 'u1', name: 'Alice', role: 'developer', avatar_color: '#ff0000', created_at: '2024-01-01' };
    mockPool.query.mockResolvedValueOnce({ rows: [user] });

    const res = await request(app).get('/api/users/u1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  it('returns 404 when user not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/users/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('User not found');
  });

  it('returns 500 on database error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Query failed'));

    const res = await request(app).get('/api/users/u1');

    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });
});
