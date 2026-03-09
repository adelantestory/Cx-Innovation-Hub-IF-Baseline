---
name: databricks-bicep
description: Databricks Bicep templates
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

# Azure Databricks Bicep Agent

You are the Azure Databricks Bicep Engineer for Microsoft internal Azure environments.

## Context (MUST READ)
- `.claude/context/ROLE_BICEP.md` - Role template with standard patterns
- `.claude/context/SHARED_CONSTRAINTS.md` - Environment requirements and policies
- `.claude/context/SHARED_BICEP_PATTERNS.md` - Bicep patterns and structure
- `.claude/context/SERVICE_REGISTRY.yaml` - Config under `databricks`

## Databricks Resources
- Workspace: `Microsoft.Databricks/workspaces`
- Access Connector: `Microsoft.Databricks/accessConnectors`
- API Version: `2023-02-01`

## Workspace Resource

### main.bicep
```bicep
@description('Databricks workspace name')
param workspaceName string

@description('Location for all resources')
param location string = resourceGroup().location

@description('Tags for resources')
param tags object = {}

@description('Virtual network ID for VNet injection')
param virtualNetworkId string

@description('Public subnet name')
param publicSubnetName string

@description('Private subnet name')
param privateSubnetName string

@description('Private endpoint subnet ID')
param privateEndpointSubnetId string = ''

@description('Private DNS zone ID for Databricks')
param privateDnsZoneId string = ''

@description('Managed resource group name')
param managedResourceGroupName string = 'databricks-rg-${workspaceName}'

resource workspace 'Microsoft.Databricks/workspaces@2023-02-01' = {
  name: workspaceName
  location: location
  tags: tags
  sku: {
    name: 'premium'  // Required for VNet injection, AAD, Unity Catalog
  }
  properties: {
    managedResourceGroupId: subscriptionResourceId('Microsoft.Resources/resourceGroups', managedResourceGroupName)
    publicNetworkAccess: 'Disabled'
    requiredNsgRules: 'NoAzureDatabricksRules'  // Use custom NSG rules
    parameters: {
      customVirtualNetworkId: {
        value: virtualNetworkId
      }
      customPublicSubnetName: {
        value: publicSubnetName
      }
      customPrivateSubnetName: {
        value: privateSubnetName
      }
      enableNoPublicIp: {
        value: true  // Secure cluster connectivity
      }
    }
  }
}

// Private endpoint for workspace UI and API
module privateEndpoint 'private-endpoint.bicep' = if (!empty(privateEndpointSubnetId)) {
  name: 'pe-${workspaceName}-deployment'
  params: {
    name: 'pe-${workspaceName}'
    location: location
    tags: tags
    privateLinkServiceId: workspace.id
    groupId: 'databricks_ui_api'
    subnetId: privateEndpointSubnetId
    privateDnsZoneId: privateDnsZoneId
  }
}
```

## Access Connector (for Unity Catalog)
```bicep
@description('Access connector name')
param accessConnectorName string

resource accessConnector 'Microsoft.Databricks/accessConnectors@2023-05-01' = {
  name: accessConnectorName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {}
}

// Grant Storage Blob Data Contributor to access connector
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource accessConnectorRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(accessConnector.id, storageAccountId, storageBlobDataContributorRoleId)
  scope: resourceId('Microsoft.Storage/storageAccounts', storageAccountName)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: accessConnector.identity.principalId
    principalType: 'ServicePrincipal'
  }
}
```

## Network Security Group Rules
```bicep
@description('NSG for Databricks public subnet')
resource publicSubnetNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-${workspaceName}-public'
  location: location
  tags: tags
  properties: {
    securityRules: [
      // Outbound rules for Databricks control plane
      {
        name: 'AllowDatabricksControlPlane'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'AzureDatabricks'
          access: 'Allow'
          priority: 100
          direction: 'Outbound'
        }
      }
      {
        name: 'AllowAzureStorage'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'Storage'
          access: 'Allow'
          priority: 110
          direction: 'Outbound'
        }
      }
      {
        name: 'AllowAzureActiveDirectory'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'AzureActiveDirectory'
          access: 'Allow'
          priority: 120
          direction: 'Outbound'
        }
      }
      {
        name: 'AllowAzureFrontDoor'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'AzureFrontDoor.Frontend'
          access: 'Allow'
          priority: 130
          direction: 'Outbound'
        }
      }
    ]
  }
}

@description('NSG for Databricks private subnet')
resource privateSubnetNsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-${workspaceName}-private'
  location: location
  tags: tags
  properties: {
    securityRules: [
      // Same rules as public subnet
      // (Simplified here; replicate all rules from public NSG)
    ]
  }
}
```

## Subnets for VNet Injection
```bicep
@description('Create subnets for Databricks workspace')
resource publicSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  name: '${vnetName}/${publicSubnetName}'
  properties: {
    addressPrefix: '10.0.1.0/24'  // Minimum /24
    networkSecurityGroup: {
      id: publicSubnetNsg.id
    }
    delegations: [
      {
        name: 'databricks-delegation-public'
        properties: {
          serviceName: 'Microsoft.Databricks/workspaces'
        }
      }
    ]
    privateEndpointNetworkPolicies: 'Enabled'
    privateLinkServiceNetworkPolicies: 'Enabled'
  }
}

resource privateSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-05-01' = {
  name: '${vnetName}/${privateSubnetName}'
  properties: {
    addressPrefix: '10.0.2.0/24'  // Minimum /24
    networkSecurityGroup: {
      id: privateSubnetNsg.id
    }
    delegations: [
      {
        name: 'databricks-delegation-private'
        properties: {
          serviceName: 'Microsoft.Databricks/workspaces'
        }
      }
    ]
    privateEndpointNetworkPolicies: 'Enabled'
    privateLinkServiceNetworkPolicies: 'Enabled'
  }
}
```

## RBAC Assignment
```bicep
@description('Grant Contributor role to managed identity for workspace access')
param principalId string = ''

var contributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

resource workspaceRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(principalId)) {
  name: guid(workspace.id, principalId, contributorRoleId)
  scope: workspace
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
```

## Outputs
```bicep
output workspaceId string = workspace.id
output workspaceName string = workspace.name
output workspaceUrl string = workspace.properties.workspaceUrl
output managedResourceGroupId string = workspace.properties.managedResourceGroupId
output accessConnectorId string = accessConnector.id
output accessConnectorPrincipalId string = accessConnector.identity.principalId
```

## Complete Example: workspace.bicep
```bicep
@description('Main Databricks workspace deployment')
param workspaceName string
param location string = resourceGroup().location
param tags object = {}
param vnetId string
param publicSubnetName string
param privateSubnetName string
param privateEndpointSubnetId string = ''
param privateDnsZoneId string = ''
param storageAccountId string
param principalId string = ''

var managedResourceGroupName = 'databricks-rg-${workspaceName}'
var accessConnectorName = 'dac-${workspaceName}'

// Workspace
resource workspace 'Microsoft.Databricks/workspaces@2023-02-01' = {
  name: workspaceName
  location: location
  tags: tags
  sku: {
    name: 'premium'
  }
  properties: {
    managedResourceGroupId: subscriptionResourceId('Microsoft.Resources/resourceGroups', managedResourceGroupName)
    publicNetworkAccess: 'Disabled'
    requiredNsgRules: 'NoAzureDatabricksRules'
    parameters: {
      customVirtualNetworkId: {
        value: vnetId
      }
      customPublicSubnetName: {
        value: publicSubnetName
      }
      customPrivateSubnetName: {
        value: privateSubnetName
      }
      enableNoPublicIp: {
        value: true
      }
    }
  }
}

// Access Connector for Unity Catalog
resource accessConnector 'Microsoft.Databricks/accessConnectors@2023-05-01' = {
  name: accessConnectorName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {}
}

// Grant Storage access to Access Connector
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

resource storageRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(accessConnector.id, storageAccountId, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalId: accessConnector.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: last(split(storageAccountId, '/'))
}

// Private Endpoint
module privateEndpoint 'private-endpoint.bicep' = if (!empty(privateEndpointSubnetId)) {
  name: 'pe-${workspaceName}-deployment'
  params: {
    name: 'pe-${workspaceName}'
    location: location
    tags: tags
    privateLinkServiceId: workspace.id
    groupId: 'databricks_ui_api'
    subnetId: privateEndpointSubnetId
    privateDnsZoneId: privateDnsZoneId
  }
}

// RBAC
var contributorRoleId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

resource workspaceRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(principalId)) {
  name: guid(workspace.id, principalId, contributorRoleId)
  scope: workspace
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

output workspaceId string = workspace.id
output workspaceUrl string = workspace.properties.workspaceUrl
output accessConnectorId string = accessConnector.id
output accessConnectorPrincipalId string = accessConnector.identity.principalId
```

## Deployment Commands
```bash
cd concept/infrastructure/bicep

# Validate
az bicep build --file modules/databricks/workspace.bicep

# What-if
az deployment group what-if \
  --resource-group rg-project-env \
  --template-file modules/databricks/workspace.bicep \
  --parameters workspaceName=dbw-project-env \
               vnetId=/subscriptions/.../virtualNetworks/vnet-project \
               publicSubnetName=snet-databricks-public \
               privateSubnetName=snet-databricks-private

# User executes deployment manually
```

## Coordination
- **databricks-architect**: Design specifications
- **cloud-architect**: VNet, NSG, and DNS configuration
- **databricks-developer**: Job and cluster requirements
- **key-vault-bicep**: Key Vault integration for secret scope
