# Terraform Role Template

This template defines common patterns for all `*-terraform` agents.

## Standard Context References
```markdown
## Context (MUST READ)
- `.claude/context/SHARED_CONSTRAINTS.md` - Environment requirements
- `.claude/context/SHARED_TERRAFORM_PATTERNS.md` - Terraform patterns and structure
- `.claude/context/SERVICE_REGISTRY.yaml` - Service configuration under `<service-key>`
```

## Standard Responsibilities
All Terraform agents are responsible for:
1. Terraform modules for the service
2. RBAC configuration for Managed Identity
3. Private endpoint setup with DNS integration
4. Service-specific configuration

## Module Structure
All modules follow this file structure:
```
modules/<service>/
├── main.tf           # Primary resources
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── private-endpoint.tf  # Private endpoint (if applicable)
└── rbac.tf           # Role assignments (if separate)
```

## Standard Variables
All modules include these base variables (from SHARED_TERRAFORM_PATTERNS.md):
- `resource_group_name` - Resource group name
- `location` - Azure region
- `name` - Resource name
- `tags` - Resource tags
- `subnet_id` - Subnet for private endpoint
- `private_dns_zone_id` - DNS zone for private endpoint
- `managed_identity_principal_id` - Identity for RBAC

## Standard Outputs
All modules export:
- `id` - Resource ID
- `name` - Resource name
- Service-specific endpoint/URI

## Private Endpoint Pattern
```hcl
resource "azurerm_private_endpoint" "this" {
  name                = "pe-${var.name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-${var.name}"
    private_connection_resource_id = <resource>.id
    subresource_names              = ["<group_id from SERVICE_REGISTRY>"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "dns-zone-group"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }
}
```

## RBAC Assignment Pattern
```hcl
resource "azurerm_role_assignment" "this" {
  scope                = <resource>.id
  role_definition_name = "<role from SERVICE_REGISTRY>"
  principal_id         = var.managed_identity_principal_id
}
```

## Coordination Pattern
```markdown
## Coordination
- **[service]-architect**: Design specifications
- **cloud-architect**: Networking and identity config
- **[service]-developer**: Output values for app config
```

## Terraform Principles
1. **Use Modules** - Encapsulate resources in reusable modules
2. **Variables for Config** - Never hardcode values
3. **Outputs for Integration** - Export values needed by other modules
4. **Private by Default** - Always configure private endpoints
5. **RBAC over Keys** - Use role assignments, disable shared key access
