// =============================================================================
// Database Service
// =============================================================================
// Manages the PostgreSQL connection pool with dual-mode configuration:
//   - LOCAL mode: AZURE_KEY_VAULT_URL is empty; reads credentials from env vars
//   - AZURE mode: AZURE_KEY_VAULT_URL is set; retrieves credentials from Key Vault
//
// This pattern allows the same codebase to run in both local Docker Compose
// and Azure Container Apps environments.
// =============================================================================

const { Pool } = require("pg");
const { ManagedIdentityCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

let pool = null;

/**
 * Retrieves PostgreSQL credentials from Azure Key Vault using Managed Identity.
 * @param {string} vaultUrl - The Key Vault URI (e.g., https://kv-xxx.vault.azure.net)
 * @returns {Promise<{host: string, user: string, password: string}>}
 */
async function getCredentialsFromKeyVault(vaultUrl) {
  const clientId = process.env.AZURE_CLIENT_ID || undefined;
  const credential = new ManagedIdentityCredential(clientId);
  const client = new SecretClient(vaultUrl, credential);

  const [hostSecret, userSecret, passwordSecret] = await Promise.all([
    client.getSecret("postgresql-connection-host"),
    client.getSecret("postgresql-admin-username"),
    client.getSecret("postgresql-admin-password"),
  ]);

  return {
    host: hostSecret.value,
    user: userSecret.value,
    password: passwordSecret.value,
  };
}

/**
 * Initializes the PostgreSQL connection pool. Must be called once at startup.
 * Determines whether to use Key Vault or environment variables based on
 * the AZURE_KEY_VAULT_URL setting.
 * @returns {Promise<Pool>} The initialized pg Pool instance
 */
async function initializePool() {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;

  let host, user, password;

  if (vaultUrl) {
    console.log("Azure mode: retrieving PostgreSQL credentials from Key Vault...");
    const credentials = await getCredentialsFromKeyVault(vaultUrl);
    host = credentials.host;
    user = credentials.user;
    password = credentials.password;
    console.log("Key Vault credentials retrieved successfully.");
  } else {
    console.log("Local mode: using environment variables for PostgreSQL credentials.");
    host = process.env.PGHOST;
    user = process.env.PGUSER;
    password = process.env.PGPASSWORD;
  }

  const sslMode = process.env.PGSSLMODE || "disable";

  pool = new Pool({
    host,
    user,
    password,
    database: process.env.PGDATABASE || "taskify",
    port: parseInt(process.env.PGPORT || "5432", 10),
    ssl: sslMode === "require" ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Test the connection
  const client = await pool.connect();
  client.release();
  console.log(`Connected to PostgreSQL at ${host}`);

  return pool;
}

/**
 * Returns the current pool instance. Throws if not initialized.
 * @returns {Pool}
 */
function getPool() {
  if (!pool) {
    throw new Error("Database pool not initialized. Call initializePool() first.");
  }
  return pool;
}

module.exports = { initializePool, getPool };
