# Test Helpers and Utilities

This directory contains helper functions and utilities for testing the Taskify API.

## Available Helpers

### `testApp.js`
- **`createTestApp()`**: Factory function for creating a configured Express test application
  - Pre-configured with JSON middleware
  - Includes error handling middleware
  - Ready for mounting route handlers

### `mockPool.js`
- **`createMockPool()`**: Factory function for creating a mock database pool
  - Provides `jest.fn()` mocks for all pool methods
  - Easily configure query responses in tests
  - Common pattern: `mockPool.query.mockResolvedValueOnce({ rows: [...] })`

## Test Patterns

See the parent directory and `.github/copilot-instructions.md` for comprehensive testing patterns and best practices.

## Example Usage

```javascript
const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const { createMockPool } = require('./helpers/mockPool');

describe('User Routes', () => {
  let app;
  let mockPool;

  beforeAll(() => {
    app = createTestApp();
    mockPool = createMockPool();
  });

  beforeEach(() => {
    mockPool.query.mockReset();
  });

  test('GET /api/users returns all users', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ id: '1', name: 'Alice' }]
    });

    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
  });
});
```
