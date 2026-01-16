# Microsoft Internal Azure Environment Constraints

This document defines the mandatory constraints for all Azure resources deployed within Microsoft's internal Azure subscription environment. **All agents must adhere to these requirements.**

## Authentication Requirements

### Managed Identity (MANDATORY)
- **All services MUST use Managed Identity** for authentication
- Use User-Assigned Managed Identity for explicit control
- Use `Azure.Identity` library with `DefaultAzureCredential` or `ManagedIdentityCredential`

### Prohibited Patterns
- **NO connection strings with embedded secrets/keys**
- **NO access keys or shared keys**
- **NO SQL authentication** (Azure AD only)
- **NO hardcoded credentials** in code or configuration
- **NO SAS tokens** where Managed Identity is supported

### Required Authentication Pattern
```
Service → Managed Identity → RBAC Role Assignment → Azure Resource
```

## Network Requirements

### Public IP Address Policy (MANDATORY)
**NO public IP addresses for Azure services** except for resources that require public ingress:

| Resource Type | Public IP Allowed | Notes |
|---------------|-------------------|-------|
| Web Apps / App Service | Yes | Public ingress for end users |
| Azure Functions (HTTP trigger) | Yes | Public ingress for APIs |
| Container Apps (with ingress) | Yes | Public ingress for end users |
| API Management (external) | Yes | Public gateway for APIs |
| Application Gateway | Yes | Public load balancer |
| **All other services** | **NO** | Must use private endpoints |

### Private Endpoint Requirements (MANDATORY)
All data and backend services MUST use private endpoints:

**Services requiring private endpoints:**
- Azure SQL Database
- Cosmos DB
- Azure Storage (Blob, Queue, Table, File)
- Key Vault
- Service Bus
- Event Hubs
- Redis Cache
- Azure OpenAI / Cognitive Services
- Container Registry
- Azure Search

**Private endpoint implementation:**
1. Create private endpoint in designated subnet
2. Configure private DNS zone for automatic name resolution
3. Disable public network access on the resource
4. Verify connectivity from VNet before disabling public access

### Connectivity Pattern (MANDATORY)
All service-to-service communication MUST use:
```
Source Service → Managed Identity → Private Endpoint → Target Service
```

**Prohibited patterns:**
- Public internet connectivity to backend services
- Service endpoints without private endpoints (less secure)
- IP-based firewall rules as primary security
- Shared Access Signatures (SAS) for service-to-service auth

### VNet Integration
Compute resources that initiate outbound connections MUST use VNet integration:

| Compute Resource | VNet Integration Method |
|------------------|------------------------|
| Container Apps | Container Apps Environment with VNet |
| Azure Functions | VNet Integration (Premium/Dedicated) |
| Web Apps | VNet Integration (Premium/Dedicated) |
| Azure Kubernetes Service | VNet-integrated cluster |

### DNS Configuration
Private endpoints require proper DNS resolution:
- Use Azure Private DNS Zones linked to VNet
- DNS zone names must match Azure's privatelink zones
- Ensure DNS resolution works from all connected VNets

### Network Security Groups
Apply NSGs to subnets containing:
- Private endpoints (restrict to necessary sources)
- Compute resources (restrict inbound/outbound)
- Follow principle of least privilege for rules

## Security Requirements

### Data Security
- **Encryption at rest** enabled (default for most Azure services)
- **Encryption in transit** via TLS 1.2+
- **Customer-managed keys** where compliance requires

### Access Control
- **RBAC-based access** over access policies where supported
- **Principle of least privilege** for all role assignments
- **No shared credentials** between services

## Compliance Requirements

### Tagging (MANDATORY)
All resources must include these tags:
- `Environment` (dev, test, staging, prod)
- `Stage` (foundation, data, compute, etc.)
- `Purpose` (description of resource purpose)

### Naming Conventions
Follow Microsoft internal naming standards:
- Resource type prefix (e.g., `sql-`, `kv-`, `st-`)
- Project/application identifier
- Environment suffix
- Region code where applicable

## Execution Policy

### Commands for Human Execution
**No agent may execute Azure CLI, PowerShell, Terraform, or Bicep commands directly.**

All deployment commands must be:
1. Documented clearly in output
2. Provided to the user for manual execution
3. Include prerequisites and sequence requirements

### Safe Operations
Agents MAY execute:
- Read-only Azure CLI queries (e.g., `az account show`)
- Local validation commands (e.g., `terraform validate`, `az bicep build`)
- Code compilation and testing

### Prohibited Operations
Agents MUST NOT execute:
- `terraform apply`
- `az deployment group create`
- `az resource create/update/delete`
- Any command that modifies Azure resources

## RBAC Role Reference

### Common Data Plane Roles
| Service | Read Role | Write Role |
|---------|-----------|------------|
| Blob Storage | Storage Blob Data Reader | Storage Blob Data Contributor |
| Cosmos DB | Cosmos DB Built-in Data Reader | Cosmos DB Built-in Data Contributor |
| Key Vault | Key Vault Secrets User | Key Vault Secrets Officer |
| Service Bus | Azure Service Bus Data Receiver | Azure Service Bus Data Owner |
| Event Hubs | Azure Event Hubs Data Receiver | Azure Event Hubs Data Owner |
| Azure SQL | db_datareader (contained user) | db_datawriter (contained user) |

### Common Control Plane Roles
| Purpose | Role |
|---------|------|
| Resource deployment | Contributor (scoped to resource group) |
| Identity management | Managed Identity Operator |
| Network configuration | Network Contributor |

## Private Endpoint Reference

| Service | Private DNS Zone | Group ID |
|---------|------------------|----------|
| Blob Storage | privatelink.blob.core.windows.net | blob |
| Azure SQL | privatelink.database.windows.net | sqlServer |
| Cosmos DB | privatelink.documents.azure.com | Sql |
| Key Vault | privatelink.vaultcore.azure.net | vault |
| Service Bus | privatelink.servicebus.windows.net | namespace |
| Event Hubs | privatelink.servicebus.windows.net | namespace |
| Redis Cache | privatelink.redis.cache.windows.net | redisCache |
| Azure OpenAI | privatelink.openai.azure.com | account |
| Container Registry | privatelink.azurecr.io | registry |

## Configuration Storage

### Allowed in Configuration Files
- Resource names
- Endpoints (URLs without credentials)
- Managed Identity Client IDs
- Region/location settings
- SKU/tier selections

### NOT Allowed in Configuration Files
- Passwords or secrets
- Access keys
- Connection strings with embedded credentials
- SAS tokens
- API keys

### Secret Storage
All secrets must be stored in Azure Key Vault and referenced via:
- Key Vault references in App Configuration
- Managed Identity access to Key Vault
