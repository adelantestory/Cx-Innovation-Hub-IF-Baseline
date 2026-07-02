import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const Module = require('module');
const originalLoad = Module._load;
const databaseModulePath = require.resolve('../../../../apps/api/src/services/database.js');

const originalEnv = { ...process.env };

const mockPoolConstructor = vi.fn();
const mockManagedIdentityCredential = vi.fn();
const mockSecretClient = vi.fn();

function setEnv(overrides: Record<string, string | undefined>) {
  process.env = {
    ...originalEnv,
    ...overrides,
  };
}

async function loadDatabaseModule() {
  delete require.cache[databaseModulePath];

  Module._load = (request: string, parent: unknown, isMain: boolean) => {
    if (request === 'pg') {
      return { Pool: mockPoolConstructor };
    }

    if (request === '@azure/identity') {
      return { ManagedIdentityCredential: mockManagedIdentityCredential };
    }

    if (request === '@azure/keyvault-secrets') {
      return { SecretClient: mockSecretClient };
    }

    return originalLoad(request, parent, isMain);
  };

  return require(databaseModulePath);
}

describe('database service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    Module._load = originalLoad;
    process.env = { ...originalEnv };
  });

  it('throws when getPool is called before initializePool', async () => {
    // Arrange
    const database = await loadDatabaseModule();

    // Act
    const getPoolBeforeInit = () => database.getPool();

    // Assert
    expect(getPoolBeforeInit).toThrow('Database pool not initialized. Call initializePool() first.');
  });

  it('initializes pool in local mode using environment variables', async () => {
    // Arrange
    const mockRelease = vi.fn();
    const mockConnect = vi.fn().mockResolvedValue({ release: mockRelease });
    const mockPool = { connect: mockConnect };

    mockPoolConstructor.mockImplementation(function MockPool() {
      return mockPool;
    });

    setEnv({
      AZURE_KEY_VAULT_URL: '',
      PGHOST: 'localhost',
      PGUSER: 'postgres',
      PGPASSWORD: 'password',
      PGDATABASE: 'taskify_local',
      PGPORT: '5433',
      PGSSLMODE: 'disable',
    });

    const database = await loadDatabaseModule();

    // Act
    const initializedPool = await database.initializePool();

    // Assert
    expect(mockSecretClient).not.toHaveBeenCalled();
    expect(mockPoolConstructor).toHaveBeenCalledWith({
      host: 'localhost',
      user: 'postgres',
      password: 'password',
      database: 'taskify_local',
      port: 5433,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledTimes(1);
    expect(initializedPool).toBe(mockPool);
    expect(database.getPool()).toBe(mockPool);
  });

  it('initializes pool in Azure mode using Key Vault secrets', async () => {
    // Arrange
    const mockRelease = vi.fn();
    const mockConnect = vi.fn().mockResolvedValue({ release: mockRelease });
    const mockPool = { connect: mockConnect };
    const mockGetSecret = vi.fn(async (secretName: string) => {
      const values: Record<string, string> = {
        'postgresql-connection-host': 'azure-db.postgres.database.azure.com',
        'postgresql-admin-username': 'azure-admin',
        'postgresql-admin-password': 'azure-password',
      };

      return { value: values[secretName] };
    });

    mockPoolConstructor.mockImplementation(function MockPool() {
      return mockPool;
    });
    mockManagedIdentityCredential.mockImplementation(function MockManagedIdentityCredential(clientId?: string) {
      return { clientId };
    });
    mockSecretClient.mockImplementation(function MockSecretClient() {
      return { getSecret: mockGetSecret };
    });

    setEnv({
      AZURE_KEY_VAULT_URL: 'https://kv-taskify.vault.azure.net',
      AZURE_CLIENT_ID: 'managed-identity-client-id',
      PGDATABASE: 'taskify_azure',
      PGPORT: '6543',
      PGSSLMODE: 'require',
      PGHOST: undefined,
      PGUSER: undefined,
      PGPASSWORD: undefined,
    });

    const database = await loadDatabaseModule();

    // Act
    await database.initializePool();

    // Assert
    expect(mockManagedIdentityCredential).toHaveBeenCalledWith('managed-identity-client-id');
    expect(mockSecretClient).toHaveBeenCalledWith(
      'https://kv-taskify.vault.azure.net',
      { clientId: 'managed-identity-client-id' },
    );
    expect(mockGetSecret).toHaveBeenCalledWith('postgresql-connection-host');
    expect(mockGetSecret).toHaveBeenCalledWith('postgresql-admin-username');
    expect(mockGetSecret).toHaveBeenCalledWith('postgresql-admin-password');
    expect(mockPoolConstructor).toHaveBeenCalledWith({
      host: 'azure-db.postgres.database.azure.com',
      user: 'azure-admin',
      password: 'azure-password',
      database: 'taskify_azure',
      port: 6543,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });
});
