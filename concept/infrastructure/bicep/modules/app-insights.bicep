// =============================================================================
// Application Insights Module
// =============================================================================
// Creates an Application Insights resource linked to a Log Analytics Workspace
// for application performance monitoring and diagnostics.
// =============================================================================

@description('Resource name for the Application Insights instance')
param name string

@description('Azure region for deployment')
param location string

@description('Resource ID of the Log Analytics Workspace to link')
param logAnalyticsWorkspaceId string

@description('Tags to apply to the resource')
param tags object

// ---------------------------------------------------------------------------
// Application Insights
// ---------------------------------------------------------------------------
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: name
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspaceId
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Application Insights instance')
output id string = appInsights.id

@description('Name of the Application Insights instance')
output name string = appInsights.name

@description('Instrumentation key for the Application Insights instance')
output instrumentationKey string = appInsights.properties.InstrumentationKey

@description('Connection string for the Application Insights instance')
output connectionString string = appInsights.properties.ConnectionString
