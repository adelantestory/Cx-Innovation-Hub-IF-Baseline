// =============================================================================
// Taskify - Unified Infrastructure Deployment
// =============================================================================
// Consolidates all four deployment stages into a single Bicep template,
// deploying resources in dependency order:
//
//   1. Log Analytics Workspace
//   2. User-Assigned Managed Identity
//   3. Key Vault (RBAC)
//   4. PostgreSQL Flexible Server
//   5. Container Apps Environment
//   6. API Container App
//   7. Web Container App
//
// Prerequisites:
//   - A Container Registry must already exist (or be deployed separately).
//     Pass its login server via the containerRegistryLoginServer parameter.
// =============================================================================

@description('Unique identifier for resource naming (e.g., "abc12")')
param uid string

@description('Azure region for deployment (e.g., westus3, eastus)')
param location string = resourceGroup().location

@description('Environment tier')
@allowed(['dev', 'stg', 'prd'])
param environment string = 'dev'

@description('PostgreSQL administrator password')
@secure()
param pgAdminPassword string

@description('Container Registry login server (e.g., crXXXtaskifydev.azurecr.io)')
param containerRegistryLoginServer string

@description('Container image tag for the API container app')
param apiImageTag string = 'latest'

@description('Container image tag for the web container app (defaults to apiImageTag)')
param webImageTag string = apiImageTag

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var baseTags = {
  Environment: environment
  Purpose: 'Taskify POC'
}

// ---------------------------------------------------------------------------
// 1. Log Analytics Workspace
// ---------------------------------------------------------------------------
module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'log-analytics-${uid}'
  params: {
    name: 'log-${uid}-taskify-${environment}'
    location: location
    sku: 'PerGB2018'
    retentionInDays: 30
    tags: union(baseTags, { Stage: 'foundation' })
  }
}

// ---------------------------------------------------------------------------
// 2. User-Assigned Managed Identity
// ---------------------------------------------------------------------------
module managedIdentity 'modules/managed-identity.bicep' = {
  name: 'managed-identity-${uid}'
  params: {
    name: 'id-${uid}-taskify-api'
    location: location
    tags: union(baseTags, { Stage: 'foundation' })
  }
}

// ---------------------------------------------------------------------------
// 3. Key Vault (RBAC)
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
    tags: union(baseTags, { Stage: 'foundation' })
  }
}

// ---------------------------------------------------------------------------
// 4. PostgreSQL Flexible Server
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
    adminUsername: 'taskifyadmin'
    adminPassword: pgAdminPassword
    databaseName: 'taskify'
    tags: union(baseTags, { Stage: 'data' })
  }
}

// ---------------------------------------------------------------------------
// 5. Container Apps Environment
// ---------------------------------------------------------------------------
module containerAppsEnvironment 'modules/container-apps-environment.bicep' = {
  name: 'container-apps-env-${uid}'
  params: {
    name: 'cae-${uid}-taskify-${environment}'
    location: location
    logAnalyticsCustomerId: logAnalytics.outputs.customerId
    logAnalyticsSharedKey: logAnalytics.outputs.sharedKey
    tags: union(baseTags, { Stage: 'container-infrastructure' })
  }
}

// ---------------------------------------------------------------------------
// 6. API Container App
// ---------------------------------------------------------------------------
module containerAppApi 'modules/container-app.bicep' = {
  name: 'container-app-api-${uid}'
  params: {
    name: 'ca-${uid}-taskify-api'
    location: location
    tags: union(baseTags, { Stage: 'application' })
    environmentId: containerAppsEnvironment.outputs.id
    registryServer: containerRegistryLoginServer
    imageName: 'taskify-api'
    imageTag: apiImageTag
    targetPort: 3000
    externalIngress: true
    minReplicas: 0
    maxReplicas: 1
    cpu: '0.25'
    memory: '0.5Gi'
    managedIdentityId: managedIdentity.outputs.id
    envVars: [
      { name: 'NODE_ENV', value: 'production' }
      { name: 'PORT', value: '3000' }
      { name: 'AZURE_KEY_VAULT_URL', value: keyVault.outputs.uri }
      { name: 'AZURE_CLIENT_ID', value: managedIdentity.outputs.clientId }
      { name: 'PGDATABASE', value: 'taskify' }
      { name: 'PGPORT', value: '5432' }
      { name: 'PGSSLMODE', value: 'require' }
    ]
  }
}

// ---------------------------------------------------------------------------
// 7. Web Container App
// ---------------------------------------------------------------------------
module containerAppWeb 'modules/container-app.bicep' = {
  name: 'container-app-web-${uid}'
  params: {
    name: 'ca-${uid}-taskify-web'
    location: location
    tags: union(baseTags, { Stage: 'application' })
    environmentId: containerAppsEnvironment.outputs.id
    registryServer: containerRegistryLoginServer
    imageName: 'taskify-web'
    imageTag: webImageTag
    targetPort: 80
    externalIngress: true
    minReplicas: 0
    maxReplicas: 1
    cpu: '0.25'
    memory: '0.5Gi'
    managedIdentityId: managedIdentity.outputs.id
    envVars: [
      { name: 'VITE_API_URL', value: containerAppApi.outputs.url }
    ]
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('URL of the API Container App')
output apiUrl string = containerAppApi.outputs.url

@description('URL of the Web Container App')
output webUrl string = containerAppWeb.outputs.url

@description('Name of the Key Vault')
output keyVaultName string = keyVault.outputs.name

@description('URI of the Key Vault')
output keyVaultUri string = keyVault.outputs.uri

@description('Name of the PostgreSQL Flexible Server')
output dbServerName string = postgresql.outputs.name

@description('FQDN of the PostgreSQL Flexible Server')
output dbServerFqdn string = postgresql.outputs.fqdn

@description('Name of the Managed Identity')
output managedIdentityName string = managedIdentity.outputs.name

@description('Client ID of the Managed Identity')
output managedIdentityClientId string = managedIdentity.outputs.clientId
