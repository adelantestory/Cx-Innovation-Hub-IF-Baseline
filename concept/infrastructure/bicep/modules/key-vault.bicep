// =============================================================================
// Azure Key Vault Module
// =============================================================================
// Creates an Azure Key Vault with RBAC authorization for secret management.
// Stores PostgreSQL connection credentials retrieved by the backend API at
// runtime via Managed Identity. Access policies are NOT used; all access
// control is via Azure RBAC role assignments.
// =============================================================================

@description('Resource name for the Key Vault')
param name string

@description('Azure region for deployment')
param location string

@description('SKU for the Key Vault')
@allowed(['standard', 'premium'])
param sku string = 'standard'

@description('Enable RBAC authorization (disables access policies)')
param enableRbacAuthorization bool = true

@description('Enable soft delete')
param enableSoftDelete bool = true

@description('Soft delete retention period in days')
param softDeleteRetentionInDays int = 7

@description('Tags to apply to the resource')
param tags object

@description('Principal ID of the Managed Identity to grant Key Vault Secrets User role')
param secretsUserPrincipalId string

@description('Tenant ID for the Key Vault')
param tenantId string = subscription().tenantId

// ---------------------------------------------------------------------------
// Key Vault
// ---------------------------------------------------------------------------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: sku
    }
    tenantId: tenantId
    enableRbacAuthorization: enableRbacAuthorization
    enableSoftDelete: enableSoftDelete
    softDeleteRetentionInDays: softDeleteRetentionInDays
    enablePurgeProtection: false // Disabled for POC to allow cleanup
    publicNetworkAccess: 'Enabled' // Required for POC; production would use private endpoints
  }
}

// ---------------------------------------------------------------------------
// RBAC: Key Vault Secrets User for Managed Identity
// ---------------------------------------------------------------------------
// Role Definition ID for "Key Vault Secrets User": 4633458b-17de-408a-b874-0445c86b69e6
resource kvSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, secretsUserPrincipalId, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    principalId: secretsUserPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    description: 'Allow API managed identity to read secrets from Key Vault'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
@description('Resource ID of the Key Vault')
output id string = keyVault.id

@description('Name of the Key Vault')
output name string = keyVault.name

@description('URI of the Key Vault')
output uri string = keyVault.properties.vaultUri
