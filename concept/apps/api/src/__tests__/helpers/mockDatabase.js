/**
 * Mock database helper for unit tests.
 * Provides a mock pool that can be configured per-test.
 */
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn()
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Default: connect returns a mock client
mockPool.connect.mockResolvedValue(mockClient);

/**
 * Reset all mock functions between tests
 */
function resetMocks() {
  mockPool.query.mockReset();
  mockPool.connect.mockReset();
  mockPool.end.mockReset();
  mockPool.on.mockReset();
  mockClient.query.mockReset();
  mockClient.release.mockReset();
  mockPool.connect.mockResolvedValue(mockClient);
}

/**
 * Setup mock to intercept require('../services/database') or similar
 * Returns the mock pool when getPool() is called
 */
function setupDatabaseMock() {
  jest.mock('../../services/database', () => ({
    getPool: jest.fn(() => mockPool),
    initializePool: jest.fn().mockResolvedValue(undefined)
  }));
}

module.exports = {
  mockPool,
  mockClient,
  resetMocks,
  setupDatabaseMock
};
