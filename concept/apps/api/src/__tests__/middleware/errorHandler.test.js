const { errorHandler, createError } = require('../../middleware/errorHandler');

describe('errorHandler middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { method: 'GET', originalUrl: '/api/test' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('responds with custom status and message', () => {
    const err = createError(400, 'Bad request data');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { status: 400, message: 'Bad request data' }
    });
  });

  it('responds with 404 status', () => {
    const err = createError(404, 'Not found');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { status: 404, message: 'Not found' }
    });
  });

  it('responds with 403 status', () => {
    const err = createError(403, 'Forbidden');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { status: 403, message: 'Forbidden' }
    });
  });

  it('defaults to 500 when error has no status', () => {
    const err = new Error('Something broke');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { status: 500, message: 'Something broke' }
    });
  });

  it('logs stack trace for 500 errors', () => {
    const err = new Error('Internal failure');

    errorHandler(err, req, res, next);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('500: Internal failure')
    );
    expect(console.error).toHaveBeenCalledWith(err.stack);
  });

  it('does not log stack trace for non-500 errors', () => {
    const err = createError(400, 'Validation error');

    errorHandler(err, req, res, next);

    // First call is the error log line, there should be no second call with stack
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('400: Validation error')
    );
  });
});

describe('createError utility', () => {
  it('returns an Error with status and message', () => {
    const err = createError(422, 'Unprocessable');

    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(422);
    expect(err.message).toBe('Unprocessable');
  });

  it('creates a 400 error', () => {
    const err = createError(400, 'Missing field');

    expect(err.status).toBe(400);
    expect(err.message).toBe('Missing field');
  });

  it('creates a 404 error', () => {
    const err = createError(404, 'Resource not found');

    expect(err.status).toBe(404);
    expect(err.message).toBe('Resource not found');
  });
});
