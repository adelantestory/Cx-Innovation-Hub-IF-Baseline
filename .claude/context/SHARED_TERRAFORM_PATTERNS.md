# Shared Terraform Patterns

This document contains standard Terraform patterns for Azure resource deployment. **All Terraform agents should reference these patterns.**

## Project Structure

```
concept/infrastructure/terraform/
├── modules/
│   ├── <service-name>/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── private-endpoint.tf (if applicable)
│   └── ...
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       └── ...
└── shared/
    ├── providers.tf
    └── versions.tf
```

## Provider Configuration

### versions.tf
```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
  }
}
```

### providers.tf
```hcl
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azuread" {}
```

## Standard Module Variables

### variables.tf (Template)
```hcl
variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "name" {
  description = "Name of the resource"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Private Endpoint Variables (include if service supports private endpoints)
variable "enable_private_endpoint" {
  description = "Enable private endpoint for the resource"
  type        = bool
  default     = true
}

variable "subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = null
}

variable "private_dns_zone_id" {
  description = "Private DNS zone ID for private endpoint"
  type        = string
  default     = null
}
```

## Private Endpoint Pattern

### private-endpoint.tf
```hcl
resource "azurerm_private_endpoint" "this" {
  count = var.enable_private_endpoint && var.subnet_id != null ? 1 : 0

  name                = "pe-${var.name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "psc-${var.name}"
    private_connection_resource_id = azurerm_<resource_type>.this.id
    subresource_names              = ["<group_id>"]  # See SERVICE_REGISTRY.yaml
    is_manual_connection           = false
  }

  dynamic "private_dns_zone_group" {
    for_each = var.private_dns_zone_id != null ? [1] : []
    content {
      name                 = "dns-zone-group"
      private_dns_zone_ids = [var.private_dns_zone_id]
    }
  }

  tags = var.tags
}
```

## Standard Outputs

### outputs.tf (Template)
```hcl
output "id" {
  description = "Resource ID"
  value       = azurerm_<resource_type>.this.id
}

output "name" {
  description = "Resource name"
  value       = azurerm_<resource_type>.this.name
}

# Include endpoint output for services with endpoints
output "endpoint" {
  description = "Resource endpoint URL"
  value       = azurerm_<resource_type>.this.<endpoint_attribute>
}

# Include private endpoint IP if applicable
output "private_endpoint_ip" {
  description = "Private endpoint IP address"
  value       = try(azurerm_private_endpoint.this[0].private_service_connection[0].private_ip_address, null)
}
```

## RBAC Assignment Pattern

```hcl
resource "azurerm_role_assignment" "this" {
  scope                = azurerm_<resource_type>.this.id
  role_definition_name = "<role_name>"  # See SERVICE_REGISTRY.yaml for roles
  principal_id         = var.managed_identity_principal_id
}
```

## Environment Configuration

### dev/main.tf
```hcl
module "<service>" {
  source = "../../modules/<service-name>"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  name                = "<service>-${var.project_name}-${var.environment}"

  enable_private_endpoint = true
  subnet_id               = module.networking.data_subnet_id
  private_dns_zone_id     = module.dns.<service>_zone_id

  tags = local.common_tags
}
```

### dev/variables.tf
```hcl
variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}
```

### dev/terraform.tfvars
```hcl
project_name = "myproject"
environment  = "dev"
location     = "eastus"
```

## Backend Configuration

### backend.tf
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stterraformstate"
    container_name       = "tfstate"
    key                  = "<project>/<environment>/terraform.tfstate"
  }
}
```

## Deployment Commands

**Provide these commands for user to execute:**

```bash
# Navigate to environment directory
cd concept/infrastructure/terraform/environments/dev

# Initialize Terraform (first time or after provider changes)
terraform init

# Validate configuration
terraform validate

# Format check
terraform fmt -check -recursive

# Plan deployment (always review before apply)
terraform plan -out=tfplan

# Apply deployment (MANUAL EXECUTION ONLY)
terraform apply tfplan

# Destroy resources (use with caution)
terraform plan -destroy -out=tfplan-destroy
terraform apply tfplan-destroy
```

## Common Patterns

### Conditional Resource Creation
```hcl
resource "azurerm_example" "this" {
  count = var.enable_feature ? 1 : 0
  # ...
}

# Reference with try()
output "example_id" {
  value = try(azurerm_example.this[0].id, null)
}
```

### For Each with Map
```hcl
resource "azurerm_example" "this" {
  for_each = var.instances

  name     = each.key
  property = each.value.property
}
```

### Local Values
```hcl
locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "Terraform"
  })

  resource_prefix = "${var.project_name}-${var.environment}"
}
```

## Security Requirements

All Terraform configurations MUST:
- [ ] Disable public network access where supported
- [ ] Enable private endpoints for data services
- [ ] Use Managed Identity for authentication
- [ ] Enable TLS 1.2+ minimum
- [ ] Enable diagnostic logging
- [ ] Apply required tags

## CRITICAL REMINDERS

1. **Never execute `terraform apply`** - Provide commands for user
2. **Always include private endpoint** - Use the pattern above
3. **Use variables** - No hardcoded values in main.tf
4. **Export outputs** - Other modules depend on these values
5. **Follow naming conventions** - Use project/environment prefix
