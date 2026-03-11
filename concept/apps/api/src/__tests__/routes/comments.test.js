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

describe('GET /api/tasks/:taskId/comments', () => {
  it('returns comments with author details', async () => {
    const comments = [
      {
        id: 'c1', task_id: 'task1', user_id: 'u1', parent_comment_id: null,
        content: 'First comment', created_at: '2024-01-01', updated_at: '2024-01-01',
        author_name: 'Alice', author_avatar_color: '#ff0000'
      },
      {
        id: 'c2', task_id: 'task1', user_id: 'u2', parent_comment_id: 'c1',
        content: 'Reply to first', created_at: '2024-01-02', updated_at: '2024-01-02',
        author_name: 'Bob', author_avatar_color: '#00ff00'
      }
    ];
    mockPool.query.mockResolvedValueOnce({ rows: comments });

    const res = await request(app).get('/api/tasks/task1/comments');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(comments);
    expect(res.body).toHaveLength(2);
  });

  it('returns empty array when no comments exist', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/tasks/task1/comments');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/tasks/task1/comments');

    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });
});

describe('POST /api/tasks/:taskId/comments', () => {
  it('creates a comment with X-User-Id header and returns 201', async () => {
    // 1st query: INSERT RETURNING *
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'c1', task_id: 'task1', user_id: 'u1', content: 'New comment' }]
    });
    // 2nd query: fetch with author JOIN
    const commentWithAuthor = {
      id: 'c1', task_id: 'task1', user_id: 'u1', parent_comment_id: null,
      content: 'New comment', created_at: '2024-01-01', updated_at: '2024-01-01',
      author_name: 'Alice', author_avatar_color: '#ff0000'
    };
    mockPool.query.mockResolvedValueOnce({ rows: [commentWithAuthor] });

    const res = await request(app)
      .post('/api/tasks/task1/comments')
      .set('X-User-Id', 'u1')
      .send({ content: 'New comment' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(commentWithAuthor);
  });

  it('returns 400 when X-User-Id header is missing', async () => {
    const res = await request(app)
      .post('/api/tasks/task1/comments')
      .send({ content: 'Some comment' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('X-User-Id header is required');
  });

  it('returns 400 when content is missing', async () => {
    const res = await request(app)
      .post('/api/tasks/task1/comments')
      .set('X-User-Id', 'u1')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Comment content is required');
  });

  it('returns 400 when content is empty', async () => {
    const res = await request(app)
      .post('/api/tasks/task1/comments')
      .set('X-User-Id', 'u1')
      .send({ content: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Comment content is required');
  });

  it('returns 400 when content is whitespace only', async () => {
    const res = await request(app)
      .post('/api/tasks/task1/comments')
      .set('X-User-Id', 'u1')
      .send({ content: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Comment content is required');
  });

  it('supports parent_comment_id for threading', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'c2', task_id: 'task1', user_id: 'u1', parent_comment_id: 'c1', content: 'Reply' }]
    });
    const commentWithAuthor = {
      id: 'c2', task_id: 'task1', user_id: 'u1', parent_comment_id: 'c1',
      content: 'Reply', created_at: '2024-01-01', updated_at: '2024-01-01',
      author_name: 'Alice', author_avatar_color: '#ff0000'
    };
    mockPool.query.mockResolvedValueOnce({ rows: [commentWithAuthor] });

    const res = await request(app)
      .post('/api/tasks/task1/comments')
      .set('X-User-Id', 'u1')
      .send({ content: 'Reply', parent_comment_id: 'c1' });

    expect(res.status).toBe(201);
    expect(res.body.parent_comment_id).toBe('c1');
    // Verify parent_comment_id was passed to the INSERT query
    expect(mockPool.query.mock.calls[0][1]).toContain('c1');
  });
});

describe('PUT /api/comments/:id', () => {
  it('updates a comment when user is the author', async () => {
    // 1st query: check ownership
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] });
    // 2nd query: UPDATE RETURNING *
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: 'c1', content: 'Updated content' }]
    });
    // 3rd query: fetch with author JOIN
    const updated = {
      id: 'c1', task_id: 'task1', user_id: 'u1', parent_comment_id: null,
      content: 'Updated content', created_at: '2024-01-01', updated_at: '2024-01-02',
      author_name: 'Alice', author_avatar_color: '#ff0000'
    };
    mockPool.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put('/api/comments/c1')
      .set('X-User-Id', 'u1')
      .send({ content: 'Updated content' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('returns 403 when user is not the author', async () => {
    // Ownership check: comment belongs to u1, but request from u2
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] });

    const res = await request(app)
      .put('/api/comments/c1')
      .set('X-User-Id', 'u2')
      .send({ content: 'Hacked content' });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('You can only edit your own comments');
  });

  it('returns 404 when comment not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/comments/nonexistent')
      .set('X-User-Id', 'u1')
      .send({ content: 'Something' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Comment not found');
  });

  it('returns 400 when X-User-Id header is missing', async () => {
    const res = await request(app)
      .put('/api/comments/c1')
      .send({ content: 'Updated' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('X-User-Id header is required');
  });

  it('returns 400 when content is missing', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] });

    const res = await request(app)
      .put('/api/comments/c1')
      .set('X-User-Id', 'u1')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Comment content is required');
  });
});

describe('DELETE /api/comments/:id', () => {
  it('deletes a comment when user is the author', async () => {
    // 1st query: check ownership
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] });
    // 2nd query: DELETE
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/comments/c1')
      .set('X-User-Id', 'u1');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Comment deleted');
    expect(res.body.id).toBe('c1');
  });

  it('returns 403 when user is not the author', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ user_id: 'u1' }] });

    const res = await request(app)
      .delete('/api/comments/c1')
      .set('X-User-Id', 'u2');

    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe('You can only delete your own comments');
  });

  it('returns 404 when comment not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/comments/nonexistent')
      .set('X-User-Id', 'u1');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Comment not found');
  });

  it('returns 400 when X-User-Id header is missing', async () => {
    const res = await request(app)
      .delete('/api/comments/c1');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('X-User-Id header is required');
  });
});
