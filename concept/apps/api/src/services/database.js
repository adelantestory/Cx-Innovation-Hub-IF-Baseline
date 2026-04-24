'use strict';
const { Pool } = require('pg');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

let pool;

async function getPool() {
  if (pool) return pool;

  let password = process.env.PGPASSWORD;

  if (process.env.AZURE_KEY_VAULT_URI) {
    try {
      const credential = new DefaultAzureCredential();
      const client = new SecretClient(process.env.AZURE_KEY_VAULT_URI, credential);
      const secret = await client.getSecret('postgresql-password');
      password = secret.value;
    } catch (err) {
      console.warn('Key Vault unavailable, falling back to PGPASSWORD:', err.message);
    }
  }

  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password,
    database: process.env.PGDATABASE || 'taskify',
    port: parseInt(process.env.PGPORT || '5432'),
    // NOTE: rejectUnauthorized: false skips cert validation — acceptable for prototype only.
    // Production deployments must set PGSSL=true with a proper CA certificate.
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  return pool;
}

module.exports = { getPool };
