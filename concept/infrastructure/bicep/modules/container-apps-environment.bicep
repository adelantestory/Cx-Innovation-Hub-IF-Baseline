// =============================================================================
// Azure Container Apps Environment Module
// =============================================================================
// Creates a Container Apps Environment (Consumption plan) that hosts the
// frontend and backend Container Apps. The environment is integrated with a
// Log Analytics Workspace for diagnostics and log collection.
// =============================================================================

@description('Resource name for the Container Apps Environment')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to the resource')
param tags object

@description('Log Analytics Workspace customer ID (workspace ID)')
param logAnalyticsCustomerId string

@description('Log Analytics Workspace shared key')
@secure()
param logAnalyticsSharedKey string

// ---------------------------------------------------------------------------
// Container Apps Environment
// ---------------------------------------------------------------------------
resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
    zoneRedundant: false
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Container Apps Environment')
output id string = containerAppsEnvironment.id

@description('Name of the Container Apps Environment')
output name string = containerAppsEnvironment.name

@description('Default domain of the Container Apps Environment')
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain
