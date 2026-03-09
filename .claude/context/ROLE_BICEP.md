# Bicep Role Template

This template defines common patterns for all `*-bicep` agents.

## Standard Context References
```markdown
## Context (MUST READ)
- `.claude/context/SHARED_CONSTRAINTS.md` - Environment requirements
- `.claude/context/SHARED_BICEP_PATTERNS.md` - Bicep patterns and structure
- `.claude/context/SERVICE_REGISTRY.yaml` - Service configuration under `<service-key>`
```

## Standard Responsibilities
All Bicep agents are responsible for:
1. Bicep templates for the service
2. RBAC configuration for Managed Identity
3. Private endpoint setup with DNS integration
4. Service-specific configuration

## Module Structure
All modules follow this file structure:
```
modules/<service>/
├── main.bicep           # Primary module
├── private-endpoint.bicep  # Reusable PE module (shared)
└── rbac.bicep           # Role assignments (if separate)
```

## Standard Parameters
All modules include these base parameters (from SHARED_BICEP_PATTERNS.md):
```bicep
param name string
param location string = resourceGroup().location
param tags object = {}
param subnetId string = ''
param privateDnsZoneId string = ''
param principalId string = ''
```

## Standard Outputs
All modules export:
```bicep
output id string = <resource>.id
output name string = <resource>.name
// Service-specific endpoint/URI
```

## Private Endpoint Pattern
```bicep
module privateEndpoint 'private-endpoint.bicep' = if (!empty(subnetId)) {
  name: 'pe-${name}-deployment'
  params: {
    name: 'pe-${name}'
    location: location
    tags: tags
    privateLinkServiceId: <resource>.id
    groupId: '<group_id from SERVICE_REGISTRY>'
    subnetId: subnetId
    privateDnsZoneId: privateDnsZoneId
  }
}
```

## RBAC Assignment Pattern
```bicep
var roleId = '<role_id from SERVICE_REGISTRY>'

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(principalId)) {
  name: guid(<resource>.id, principalId, roleId)
  scope: <resource>
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
```

## Deployment Commands
```bash
cd concept/infrastructure/bicep

# Validate
az bicep build --file modules/<service>/main.bicep

# What-if
az deployment group what-if \
  --resource-group rg-<project>-<env> \
  --template-file modules/<service>/main.bicep \
  --parameters environments/<env>.bicepparam

# User executes deployment manually
```

## Coordination Pattern
```markdown
## Coordination
- **[service]-architect**: Design specifications
- **cloud-architect**: Networking and identity config
- **[service]-developer**: Output values for app config
```

## Bicep Principles
1. **Use Modules** - Encapsulate resources in reusable modules
2. **Parameters for Config** - Use @description decorators
3. **Outputs for Integration** - Export values needed by other modules
4. **Private by Default** - Always configure private endpoints
5. **RBAC over Keys** - Use role assignments, disable shared key access
6. **Secure Outputs** - Use @secure() for sensitive values
