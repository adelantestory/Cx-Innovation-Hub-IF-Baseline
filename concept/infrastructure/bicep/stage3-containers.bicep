// =============================================================================
// Stage 3: Container Infrastructure
// =============================================================================
// Deploys container infrastructure:
//   - Azure Container Registry (image storage)
//   - Azure Container Apps Environment (hosting platform)
//
// Prerequisites:
//   - Stage 1: Managed Identity (for AcrPull RBAC), Log Analytics (for CAE)
// =============================================================================

@description('Unique identifier for resource naming')
param uid string

@description('Azure region for deployment')
param location string

@description('Environment (dev, stg, prd)')
@allowed(['dev', 'stg', 'prd'])
param environment string = 'dev'

@description('Principal ID of the Managed Identity for AcrPull role assignment')
param managedIdentityPrincipalId string

@description('Log Analytics Workspace customer ID')
param logAnalyticsCustomerId string

@description('Log Analytics Workspace shared key')
@secure()
param logAnalyticsSharedKey string

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var baseTags = {
  Environment: environment
  Stage: 'container-infrastructure'
  Purpose: 'Taskify POC'
}

// Container Registry names cannot contain hyphens
var crName = 'cr${uid}taskify${environment}'

// ---------------------------------------------------------------------------
// Container Registry
// ---------------------------------------------------------------------------
module containerRegistry 'modules/container-registry.bicep' = {
  name: 'container-registry-${uid}'
  params: {
    name: crName
    location: location
    sku: 'Basic'
    acrPullPrincipalId: managedIdentityPrincipalId
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Container Apps Environment
// ---------------------------------------------------------------------------
module containerAppsEnvironment 'modules/container-apps-environment.bicep' = {
  name: 'container-apps-env-${uid}'
  params: {
    name: 'cae-${uid}-taskify-${environment}'
    location: location
    logAnalyticsCustomerId: logAnalyticsCustomerId
    logAnalyticsSharedKey: logAnalyticsSharedKey
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output containerRegistryId string = containerRegistry.outputs.id
output containerRegistryName string = containerRegistry.outputs.name
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer

output containerAppsEnvironmentId string = containerAppsEnvironment.outputs.id
output containerAppsEnvironmentName string = containerAppsEnvironment.outputs.name
output containerAppsEnvironmentDefaultDomain string = containerAppsEnvironment.outputs.defaultDomain
