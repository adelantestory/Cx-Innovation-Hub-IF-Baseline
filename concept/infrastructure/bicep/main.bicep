// =============================================================================
// Main Bicep Composition
// =============================================================================
// Orchestrates the full infrastructure deployment by calling each stage module
// in sequence with proper dependency chaining:
//   - Stage 1: Foundation (Log Analytics, Managed Identity, Key Vault)
//   - Stage 2: Data (PostgreSQL Flexible Server)
//   - Stage 3: Containers (Container Registry, Container Apps Environment)
//   - Stage 4: Application (API + Web Container Apps) — conditional
//   - Stage 5: Performance (Application Insights, Load Testing)
//
// Stage 4 is only deployed when a container registry login server is provided,
// indicating that container images have been built and pushed.
// =============================================================================

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

@description('Unique identifier for resource naming')
param uid string

@description('Azure region for deployment')
param location string

@description('Environment (dev, stg, prd)')
@allowed(['dev', 'stg', 'prd', 'perf'])
param environment string = 'dev'

@secure()
@description('PostgreSQL administrator password')
param pgAdminPassword string

@description('Container registry login server (leave empty to skip Stage 4)')
param containerRegistryLoginServer string = ''

@description('Tag for the API container image')
param apiImageTag string = 'latest'

// ---------------------------------------------------------------------------
// Stage 1: Foundation
// ---------------------------------------------------------------------------

module stage1 'stage1-foundation.bicep' = {
  name: 'stage1-${uid}'
  params: {
    uid: uid
    location: location
    environment: environment
  }
}

// ---------------------------------------------------------------------------
// Stage 2: Data
// ---------------------------------------------------------------------------

module stage2 'stage2-data.bicep' = {
  name: 'stage2-${uid}'
  params: {
    uid: uid
    location: location
    environment: environment
    adminPassword: pgAdminPassword
  }
}

// ---------------------------------------------------------------------------
// Stage 3: Containers
// ---------------------------------------------------------------------------

module stage3 'stage3-containers.bicep' = {
  name: 'stage3-${uid}'
  params: {
    uid: uid
    location: location
    environment: environment
    managedIdentityPrincipalId: stage1.outputs.managedIdentityPrincipalId
    logAnalyticsCustomerId: stage1.outputs.logAnalyticsCustomerId
    logAnalyticsSharedKey: stage1.outputs.logAnalyticsSharedKey
  }
}

// ---------------------------------------------------------------------------
// Stage 4: Application (conditional — only when images are available)
// ---------------------------------------------------------------------------

var deployApps = containerRegistryLoginServer != ''

module stage4 'stage4-application.bicep' = if (deployApps) {
  name: 'stage4-${uid}'
  params: {
    uid: uid
    location: location
    environment: environment
    environmentId: stage3.outputs.containerAppsEnvironmentId
    registryLoginServer: containerRegistryLoginServer
    managedIdentityId: stage1.outputs.managedIdentityId
    managedIdentityClientId: stage1.outputs.managedIdentityClientId
    keyVaultUri: stage1.outputs.keyVaultUri
  }
}

// ---------------------------------------------------------------------------
// Stage 5: Performance
// ---------------------------------------------------------------------------

module stage5 'stage5-performance.bicep' = {
  name: 'stage5-${uid}'
  params: {
    uid: uid
    location: location
    environment: environment
    logAnalyticsWorkspaceId: stage1.outputs.logAnalyticsId
  }
}

// ---------------------------------------------------------------------------
// Outputs (consumed by deploy-infrastructure.yml workflow)
// ---------------------------------------------------------------------------

output apiUrl string = deployApps ? stage4.outputs.containerAppApiUrl : 'not-deployed'
output webUrl string = deployApps ? stage4.outputs.containerAppWebUrl : 'not-deployed'
output keyVaultName string = stage1.outputs.keyVaultName
output dbServerName string = stage2.outputs.postgresqlName
output dbServerFqdn string = stage2.outputs.postgresqlFqdn
output appInsightsConnectionString string = stage5.outputs.appInsightsConnectionString
output containerRegistryLoginServer string = stage3.outputs.containerRegistryLoginServer
