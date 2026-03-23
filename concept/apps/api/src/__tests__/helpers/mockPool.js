/**
 * Factory function to create a mock database pool for testing.
 * The mock pool provides a query method that can be configured per test.
 *
 * @returns {Object} Mock pool object with jest mock functions
 *
 * @example
 * const mockPool = createMockPool();
 * mockPool.query.mockResolvedValueOnce({ rows: [{ id: '1', name: 'Alice' }] });
 * const result = await db.getUsers(mockPool);
 * expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
 */
function createMockPool() {
  return {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
    release: jest.fn(),
  };
}

module.exports = { createMockPool };
