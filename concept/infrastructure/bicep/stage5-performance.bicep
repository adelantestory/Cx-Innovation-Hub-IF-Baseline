// =============================================================================
// Stage 5: Performance
// =============================================================================
// Deploys performance monitoring and testing infrastructure:
//   - Application Insights (application performance monitoring)
//   - Azure Load Testing (load and performance testing)
//
// This stage depends on Stage 1 (Foundation) for the Log Analytics Workspace.
// =============================================================================

@description('Unique identifier for resource naming')
param uid string

@description('Azure region for deployment')
param location string

@description('Environment (dev, stg, prd)')
@allowed(['dev', 'stg', 'prd', 'perf'])
param environment string = 'dev'

@description('Resource ID of the Log Analytics Workspace from Stage 1')
param logAnalyticsWorkspaceId string

@description('Name of the API Container App (for reference in load tests)')
param apiContainerAppName string = ''

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
var baseTags = {
  Environment: environment
  Stage: 'performance'
  Purpose: 'Taskify POC'
}

// ---------------------------------------------------------------------------
// Application Insights
// ---------------------------------------------------------------------------
module appInsights 'modules/app-insights.bicep' = {
  name: 'app-insights-${uid}'
  params: {
    name: 'appi-${uid}-taskify-${environment}'
    location: location
    logAnalyticsWorkspaceId: logAnalyticsWorkspaceId
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Azure Load Testing
// ---------------------------------------------------------------------------
module loadTesting 'modules/load-testing.bicep' = {
  name: 'load-testing-${uid}'
  params: {
    name: 'lt-${uid}-taskify-${environment}'
    location: location
    tags: baseTags
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output appInsightsId string = appInsights.outputs.id
output appInsightsName string = appInsights.outputs.name
output appInsightsConnectionString string = appInsights.outputs.connectionString
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey

output loadTestingId string = loadTesting.outputs.id
output loadTestingName string = loadTesting.outputs.name
