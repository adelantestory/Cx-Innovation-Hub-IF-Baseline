// =============================================================================
// Stage 1: Foundation
// =============================================================================
// Deploys foundational infrastructure:
//   - Log Analytics Workspace (monitoring)
//   - User-Assigned Managed Identity (service-to-service auth)
//   - Key Vault (secret storage with RBAC)
//
// This stage must be deployed first. Subsequent stages depend on the managed
// identity and Key Vault created here.
// =============================================================================

@description('Unique identifier for resource naming')
param uid string

@description('Azure region for deployment')
param location string

@description('Environment (dev, stg, prd)')
@allowed(['dev', 'stg', 'prd'])
param environment string = 'dev'

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var baseTags = {
  Environment: environment
  Stage: 'foundation'
  Purpose: 'Taskify POC'
}

// ---------------------------------------------------------------------------
// Log Analytics Workspace
// ---------------------------------------------------------------------------
module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'log-analytics-${uid}'
  params: {
    name: 'log-${uid}-taskify-${environment}'
    location: location
    sku: 'PerGB2018'
    retentionInDays: 30
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// User-Assigned Managed Identity
// ---------------------------------------------------------------------------
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'managed-identity-${uid}'
  params: {
    name: 'id-${uid}-taskify-api'
    location: location
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Key Vault
// ---------------------------------------------------------------------------
module keyVault 'modules/key-vault.bicep' = {
  name: 'key-vault-${uid}'
  params: {
    name: 'kv-${uid}-taskify-${environment}'
    location: location
    sku: 'standard'
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    secretsUserPrincipalId: managedIdentity.outputs.principalId
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output logAnalyticsId string = logAnalytics.outputs.id
output logAnalyticsName string = logAnalytics.outputs.name
output logAnalyticsCustomerId string = logAnalytics.outputs.customerId
output logAnalyticsSharedKey string = logAnalytics.outputs.sharedKey

output managedIdentityId string = managedIdentity.outputs.id
output managedIdentityName string = managedIdentity.outputs.name
output managedIdentityClientId string = managedIdentity.outputs.clientId
output managedIdentityPrincipalId string = managedIdentity.outputs.principalId

output keyVaultId string = keyVault.outputs.id
output keyVaultName string = keyVault.outputs.name
output keyVaultUri string = keyVault.outputs.uri
