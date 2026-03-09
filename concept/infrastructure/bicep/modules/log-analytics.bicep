// =============================================================================
// Log Analytics Workspace Module
// =============================================================================
// Creates a Log Analytics Workspace for container diagnostics and monitoring.
// Used by the Container Apps Environment for log collection.
// =============================================================================

@description('Resource name for the Log Analytics Workspace')
param name string

@description('Azure region for deployment')
param location string

@description('SKU for the Log Analytics Workspace')
param sku string = 'PerGB2018'

@description('Retention period in days')
param retentionInDays int = 30

@description('Tags to apply to the resource')
param tags object

// ---------------------------------------------------------------------------
// Log Analytics Workspace
// ---------------------------------------------------------------------------
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      name: sku
    }
    retentionInDays: retentionInDays
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Log Analytics Workspace')
output id string = logAnalytics.id

@description('Name of the Log Analytics Workspace')
output name string = logAnalytics.name

@description('Customer ID (workspace ID) used for Container Apps Environment')
output customerId string = logAnalytics.properties.customerId

@description('Primary shared key for Container Apps Environment integration')
output sharedKey string = logAnalytics.listKeys().primarySharedKey
