describe('database service', () => {
  let dbModule;

  beforeEach(() => {
    // Clear the module cache so we get a fresh instance each test
    jest.resetModules();
  });

  it('exports initializePool function', () => {
    // Mock pg to prevent actual connection
    jest.mock('pg', () => ({
      Pool: jest.fn()
    }));
    jest.mock('@azure/identity', () => ({
      ManagedIdentityCredential: jest.fn()
    }));
    jest.mock('@azure/keyvault-secrets', () => ({
      SecretClient: jest.fn()
    }));

    dbModule = require('../../services/database');

    expect(typeof dbModule.initializePool).toBe('function');
  });

  it('exports getPool function', () => {
    jest.mock('pg', () => ({
      Pool: jest.fn()
    }));
    jest.mock('@azure/identity', () => ({
      ManagedIdentityCredential: jest.fn()
    }));
    jest.mock('@azure/keyvault-secrets', () => ({
      SecretClient: jest.fn()
    }));

    dbModule = require('../../services/database');

    expect(typeof dbModule.getPool).toBe('function');
  });

  it('getPool() throws when pool is not initialized', () => {
    jest.mock('pg', () => ({
      Pool: jest.fn()
    }));
    jest.mock('@azure/identity', () => ({
      ManagedIdentityCredential: jest.fn()
    }));
    jest.mock('@azure/keyvault-secrets', () => ({
      SecretClient: jest.fn()
    }));

    dbModule = require('../../services/database');

    expect(() => dbModule.getPool()).toThrow(
      'Database pool not initialized. Call initializePool() first.'
    );
  });
});
