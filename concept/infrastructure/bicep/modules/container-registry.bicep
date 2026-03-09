// =============================================================================
// Azure Container Registry Module
// =============================================================================
// Creates a Container Registry for storing Docker images. Admin user is
// disabled; all image pulls are authenticated via Managed Identity with the
// AcrPull role. Images are pushed by the deploying user via az acr login.
// =============================================================================

@description('Resource name for the Container Registry (no hyphens allowed)')
param name string

@description('Azure region for deployment')
param location string

@description('SKU for the Container Registry')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Basic'

@description('Tags to apply to the resource')
param tags object

@description('Principal ID of the Managed Identity to grant AcrPull role')
param acrPullPrincipalId string

// ---------------------------------------------------------------------------
// Container Registry
// ---------------------------------------------------------------------------
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

// ---------------------------------------------------------------------------
// RBAC: AcrPull for Managed Identity
// ---------------------------------------------------------------------------
// Role Definition ID for "AcrPull": 7f951dda-4ed3-4680-a7ca-43fe172d538d
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistry.id, acrPullPrincipalId, '7f951dda-4ed3-4680-a7ca-43fe172d538d')
  scope: containerRegistry
  properties: {
    principalId: acrPullPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    description: 'Allow API managed identity to pull container images'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Container Registry')
output id string = containerRegistry.id

@description('Name of the Container Registry')
output name string = containerRegistry.name

@description('Login server for the Container Registry')
output loginServer string = containerRegistry.properties.loginServer
