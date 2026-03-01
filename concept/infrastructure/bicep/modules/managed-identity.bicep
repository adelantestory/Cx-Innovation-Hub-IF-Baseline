// =============================================================================
// User-Assigned Managed Identity Module
// =============================================================================
// Creates a User-Assigned Managed Identity for the backend API. This identity
// is used for keyless authentication to Key Vault (secret retrieval) and
// Container Registry (image pull). Microsoft internal Azure environments
// mandate Managed Identity over connection strings or access keys.
// =============================================================================

@description('Resource name for the Managed Identity')
param name string

@description('Azure region for deployment')
param location string

@description('Tags to apply to the resource')
param tags object

// ---------------------------------------------------------------------------
// User-Assigned Managed Identity
// ---------------------------------------------------------------------------
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: tags
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Managed Identity')
output id string = managedIdentity.id

@description('Name of the Managed Identity')
output name string = managedIdentity.name

@description('Client ID of the Managed Identity')
output clientId string = managedIdentity.properties.clientId

@description('Principal ID (object ID) of the Managed Identity')
output principalId string = managedIdentity.properties.principalId
