// =============================================================================
// Stage 2: Data
// =============================================================================
// Deploys data infrastructure:
//   - Azure Database for PostgreSQL Flexible Server
//   - Firewall rule for Azure services
//   - Application database
//
// Prerequisites: Stage 1 (Key Vault must exist for secret storage).
// The deployment script stores the PostgreSQL credentials in Key Vault
// after this stage completes.
// =============================================================================

@description('Unique identifier for resource naming')
param uid string

@description('Azure region for deployment')
param location string

@description('Environment (dev, stg, prd)')
@allowed(['dev', 'stg', 'prd'])
param environment string = 'dev'

@description('PostgreSQL administrator username')
param adminUsername string = 'taskifyadmin'

@description('PostgreSQL administrator password')
@secure()
param adminPassword string

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var baseTags = {
  Environment: environment
  Stage: 'data'
  Purpose: 'Taskify POC'
}

// ---------------------------------------------------------------------------
// PostgreSQL Flexible Server
// ---------------------------------------------------------------------------
module postgresql 'modules/postgresql.bicep' = {
  name: 'postgresql-${uid}'
  params: {
    name: 'psql-${uid}-taskify-${environment}'
    location: location
    skuName: 'Standard_B1ms'
    skuTier: 'Burstable'
    version: '16'
    storageSizeGB: 32
    backupRetentionDays: 7
    adminUsername: adminUsername
    adminPassword: adminPassword
    databaseName: 'taskify'
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output postgresqlId string = postgresql.outputs.id
output postgresqlName string = postgresql.outputs.name
output postgresqlFqdn string = postgresql.outputs.fqdn
output postgresqlDatabaseName string = postgresql.outputs.databaseName
