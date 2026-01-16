# Shared Bicep Patterns

This document contains standard Bicep patterns for Azure resource deployment. **All Bicep agents should reference these patterns.**

## Project Structure

```
concept/infrastructure/bicep/
├── modules/
│   ├── <service-name>/
│   │   ├── main.bicep
│   │   └── private-endpoint.bicep (if applicable)
│   └── ...
├── environments/
│   ├── dev.bicepparam
│   └── prod.bicepparam
└── main.bicep (orchestration)
```

## Standard Module Parameters

### main.bicep (Module Template)
```bicep
@description('Name of the resource')
param name string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Tags to apply to all resources')
param tags object = {}

// Private Endpoint Parameters (include if service supports private endpoints)
@description('Enable private endpoint')
param enablePrivateEndpoint bool = true

@description('Subnet resource ID for private endpoint')
param subnetId string = ''

@description('Private DNS zone resource ID')
param privateDnsZoneId string = ''
```

## Private Endpoint Pattern

### private-endpoint.bicep
```bicep
@description('Name of the private endpoint')
param name string

@description('Location for the private endpoint')
param location string

@description('Tags to apply')
param tags object = {}

@description('Resource ID of the service to connect to')
param privateLinkServiceId string

@description('Group ID for the private link (e.g., blob, vault, sqlServer)')
param groupId string

@description('Subnet ID for the private endpoint')
param subnetId string

@description('Private DNS zone ID (optional)')
param privateDnsZoneId string = ''

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'psc-${name}'
        properties: {
          privateLinkServiceId: privateLinkServiceId
          groupIds: [
            groupId
          ]
        }
      }
    ]
  }
}

resource privateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = if (!empty(privateDnsZoneId)) {
  parent: privateEndpoint
  name: 'dns-zone-group'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

output privateEndpointId string = privateEndpoint.id
output privateIpAddress string = privateEndpoint.properties.customDnsConfigs[0].ipAddresses[0]
```

### Using Private Endpoint Module
```bicep
module privateEndpoint 'private-endpoint.bicep' = if (enablePrivateEndpoint && !empty(subnetId)) {
  name: 'pe-${name}-deployment'
  params: {
    name: 'pe-${name}'
    location: location
    tags: tags
    privateLinkServiceId: mainResource.id
    groupId: '<group_id>'  // See SERVICE_REGISTRY.yaml
    subnetId: subnetId
    privateDnsZoneId: privateDnsZoneId
  }
}
```

## RBAC Assignment Pattern

```bicep
@description('Principal ID of the managed identity')
param principalId string

@description('Role definition ID or built-in role name')
param roleDefinitionId string

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(mainResource.id, principalId, roleDefinitionId)
  scope: mainResource
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
```

### Common Role Definition IDs
```bicep
// Storage
var storageBlobDataContributor = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
var storageBlobDataReader = '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1'

// Key Vault
var keyVaultSecretsUser = '4633458b-17de-408a-b874-0445c86b69e6'
var keyVaultSecretsOfficer = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'

// Cosmos DB
var cosmosDbDataContributor = '00000000-0000-0000-0000-000000000002'  // Built-in Cosmos role

// Service Bus
var serviceBusDataOwner = '090c5cfd-751d-490a-894a-3ce6f1109419'
```

## Standard Outputs

```bicep
@description('Resource ID')
output id string = mainResource.id

@description('Resource name')
output name string = mainResource.name

@description('Resource endpoint (if applicable)')
output endpoint string = mainResource.properties.<endpointProperty>

@description('Private endpoint IP (if enabled)')
output privateEndpointIp string = enablePrivateEndpoint && !empty(subnetId) ? privateEndpoint.outputs.privateIpAddress : ''
```

## Orchestration Pattern

### main.bicep (Root)
```bicep
targetScope = 'subscription'

@description('Environment name')
@allowed(['dev', 'test', 'prod'])
param environment string

@description('Project name')
param projectName string

@description('Azure region')
param location string = 'eastus'

@description('Tags for all resources')
param tags object = {}

var resourceGroupName = 'rg-${projectName}-${environment}'
var commonTags = union(tags, {
  Environment: environment
  Project: projectName
  ManagedBy: 'Bicep'
})

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: commonTags
}

// Deploy modules
module storage 'modules/storage/main.bicep' = {
  scope: rg
  name: 'storage-deployment'
  params: {
    name: 'st${projectName}${environment}'
    location: location
    tags: commonTags
    // ... other params
  }
}
```

## Parameters File

### dev.bicepparam
```bicep
using '../main.bicep'

param environment = 'dev'
param projectName = 'myproject'
param location = 'eastus'
param tags = {
  CostCenter: '12345'
  Owner: 'team@company.com'
}
```

## Deployment Commands

**Provide these commands for user to execute:**

```bash
# Navigate to bicep directory
cd concept/infrastructure/bicep

# Validate template syntax
az bicep build --file main.bicep

# Validate deployment (what-if at subscription scope)
az deployment sub what-if \
  --location eastus \
  --template-file main.bicep \
  --parameters environments/dev.bicepparam

# Deploy (MANUAL EXECUTION ONLY)
az deployment sub create \
  --location eastus \
  --template-file main.bicep \
  --parameters environments/dev.bicepparam \
  --name "deployment-$(date +%Y%m%d-%H%M%S)"

# For resource group scoped deployments
az deployment group validate \
  --resource-group rg-myproject-dev \
  --template-file modules/<service>/main.bicep \
  --parameters @environments/dev.bicepparam

az deployment group what-if \
  --resource-group rg-myproject-dev \
  --template-file modules/<service>/main.bicep \
  --parameters @environments/dev.bicepparam

az deployment group create \
  --resource-group rg-myproject-dev \
  --template-file modules/<service>/main.bicep \
  --parameters @environments/dev.bicepparam
```

## Common Patterns

### Conditional Resources
```bicep
resource optionalResource 'Microsoft.Example/resources@2023-01-01' = if (enableFeature) {
  name: name
  // ...
}

// Output with conditional
output optionalResourceId string = enableFeature ? optionalResource.id : ''
```

### Loops
```bicep
@description('List of container names to create')
param containerNames array

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = [for containerName in containerNames: {
  name: containerName
  // ...
}]
```

### Existing Resources
```bicep
@description('Name of existing Key Vault')
param keyVaultName string

@description('Resource group of existing Key Vault')
param keyVaultResourceGroup string

resource existingKeyVault 'Microsoft.KeyVault/vaults@2023-02-01' existing = {
  name: keyVaultName
  scope: resourceGroup(keyVaultResourceGroup)
}

// Use existing resource
var keyVaultUri = existingKeyVault.properties.vaultUri
```

### User-Defined Types
```bicep
@description('Network configuration')
type networkConfig = {
  subnetId: string
  privateDnsZoneId: string?
  enablePrivateEndpoint: bool
}

param networkSettings networkConfig
```

## Security Requirements

All Bicep templates MUST:
- [ ] Disable public network access where supported
- [ ] Enable private endpoints for data services
- [ ] Use Managed Identity for authentication
- [ ] Enable TLS 1.2+ minimum (`minTlsVersion: 'TLS1_2'`)
- [ ] Enable diagnostic logging
- [ ] Apply required tags

## API Versions

Use recent stable API versions. Reference:
- Storage: `2023-01-01`
- Key Vault: `2023-02-01`
- Cosmos DB: `2023-04-15`
- SQL: `2023-05-01-preview`
- Service Bus: `2022-10-01-preview`
- Container Apps: `2023-05-01`
- Private Endpoints: `2023-05-01`

## CRITICAL REMINDERS

1. **Never execute deployments** - Provide commands for user
2. **Always include private endpoint** - Use the module pattern above
3. **Use parameters** - No hardcoded values in modules
4. **Export outputs** - Other modules depend on these values
5. **Follow naming conventions** - Use project/environment variables
