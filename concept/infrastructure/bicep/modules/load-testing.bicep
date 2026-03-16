// =============================================================================
// Azure Load Testing Module
// =============================================================================
// Creates an Azure Load Testing resource for performance and load testing
// of application endpoints.
// =============================================================================

@description('Resource name for the Azure Load Testing instance')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to the resource')
param tags object

// ---------------------------------------------------------------------------
// Azure Load Testing
// ---------------------------------------------------------------------------
resource loadTest 'Microsoft.LoadTestService/loadTests@2022-12-01' = {
  name: name
  location: location
  tags: tags
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Azure Load Testing instance')
output id string = loadTest.id

@description('Name of the Azure Load Testing instance')
output name string = loadTest.name

@description('Data plane URI for the Azure Load Testing instance')
output dataPlaneUri string = loadTest.properties.dataPlaneURI
