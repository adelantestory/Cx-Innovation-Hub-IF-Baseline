# Shared Authentication Patterns

This document contains standard authentication patterns for Azure SDK usage with Managed Identity. **All developer agents should reference these patterns.**

## Credential Creation

### C# / .NET
```csharp
using Azure.Identity;

// For User-Assigned Managed Identity (PREFERRED in production)
var credential = new ManagedIdentityCredential("<client-id>");

// For default credential chain (works locally with Azure CLI)
var credential = new DefaultAzureCredential();

// With explicit options
var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
{
    ManagedIdentityClientId = "<client-id>"
});
```

### Python
```python
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential

# For User-Assigned Managed Identity (PREFERRED in production)
credential = ManagedIdentityCredential(client_id="<client-id>")

# For default credential chain (works locally with Azure CLI)
credential = DefaultAzureCredential()

# With explicit managed identity client ID
credential = DefaultAzureCredential(managed_identity_client_id="<client-id>")
```

### Node.js / TypeScript
```typescript
import { DefaultAzureCredential, ManagedIdentityCredential } from "@azure/identity";

// For User-Assigned Managed Identity (PREFERRED in production)
const credential = new ManagedIdentityCredential("<client-id>");

// For default credential chain (works locally with Azure CLI)
const credential = new DefaultAzureCredential();

// With explicit options
const credential = new DefaultAzureCredential({
  managedIdentityClientId: "<client-id>"
});
```

## Configuration Pattern

Store configuration WITHOUT secrets:

```json
{
  "ServiceName": {
    "Endpoint": "https://<resource-name>.<service>.azure.com"
  },
  "ManagedIdentity": {
    "ClientId": "<user-assigned-managed-identity-client-id>"
  }
}
```

### Environment Variables Alternative
```bash
AZURE_CLIENT_ID=<user-assigned-managed-identity-client-id>
SERVICE_ENDPOINT=https://<resource-name>.<service>.azure.com
```

## Required Packages

### .NET (NuGet)
```xml
<!-- Core identity package (required for all Azure SDK usage) -->
<PackageReference Include="Azure.Identity" Version="1.10.4" />

<!-- Service-specific packages - add as needed -->
<PackageReference Include="Azure.Storage.Blobs" Version="12.19.1" />
<PackageReference Include="Azure.Security.KeyVault.Secrets" Version="4.5.0" />
<PackageReference Include="Microsoft.Azure.Cosmos" Version="3.37.0" />
<PackageReference Include="Azure.Messaging.ServiceBus" Version="7.17.0" />
<PackageReference Include="Azure.AI.OpenAI" Version="1.0.0-beta.12" />
```

### Python (pip)
```text
# Core identity package (required for all Azure SDK usage)
azure-identity

# Service-specific packages - add as needed
azure-storage-blob
azure-keyvault-secrets
azure-cosmos
azure-servicebus
openai
```

### Node.js (npm)
```json
{
  "@azure/identity": "^4.0.0",
  "@azure/storage-blob": "^12.17.0",
  "@azure/keyvault-secrets": "^4.7.0",
  "@azure/cosmos": "^4.0.0",
  "@azure/service-bus": "^7.9.0",
  "openai": "^4.0.0"
}
```

## Dependency Injection Patterns

### .NET Dependency Injection
```csharp
// In Program.cs or Startup.cs
services.AddSingleton<TokenCredential>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var clientId = config["ManagedIdentity:ClientId"];

    return string.IsNullOrEmpty(clientId)
        ? new DefaultAzureCredential()
        : new ManagedIdentityCredential(clientId);
});

// Then inject into services
services.AddSingleton<IMyService>(sp =>
{
    var credential = sp.GetRequiredService<TokenCredential>();
    var endpoint = sp.GetRequiredService<IConfiguration>()["ServiceName:Endpoint"];
    return new MyService(endpoint, credential);
});
```

### Python Dependency Pattern
```python
from functools import lru_cache
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
import os

@lru_cache()
def get_credential():
    client_id = os.getenv("AZURE_CLIENT_ID")
    if client_id:
        return ManagedIdentityCredential(client_id=client_id)
    return DefaultAzureCredential()
```

### Node.js/TypeScript Pattern
```typescript
import { TokenCredential, DefaultAzureCredential, ManagedIdentityCredential } from "@azure/identity";

let credentialInstance: TokenCredential | null = null;

export function getCredential(): TokenCredential {
  if (!credentialInstance) {
    const clientId = process.env.AZURE_CLIENT_ID;
    credentialInstance = clientId
      ? new ManagedIdentityCredential(clientId)
      : new DefaultAzureCredential();
  }
  return credentialInstance;
}
```

## Error Handling

### Common Authentication Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `CredentialUnavailableException` | No valid credential found | Verify Managed Identity is assigned to resource |
| `AuthenticationFailedException` | Token acquisition failed | Check RBAC role assignment |
| 401 Unauthorized | Missing or invalid token | Verify identity has required RBAC role |
| 403 Forbidden | Insufficient permissions | Assign appropriate RBAC role |

### Retry Pattern (C#)
```csharp
try
{
    // Azure SDK operations
}
catch (RequestFailedException ex) when (ex.Status == 401)
{
    _logger.LogError("Authentication failed. Verify Managed Identity has required RBAC role.");
    throw;
}
catch (RequestFailedException ex) when (ex.Status == 403)
{
    _logger.LogError("Authorization failed. Check RBAC role assignments.");
    throw;
}
```

## Local Development

For local development, `DefaultAzureCredential` falls back through:
1. Environment variables
2. Managed Identity (if running in Azure)
3. Visual Studio credential
4. Azure CLI credential (`az login`)
5. Azure PowerShell credential

**Recommended local setup:**
```bash
# Login with Azure CLI
az login

# Set subscription (if multiple)
az account set --subscription "<subscription-id>"
```

## Token Scopes Reference

| Service | Token Scope |
|---------|-------------|
| Azure Storage | `https://storage.azure.com/.default` |
| Azure SQL | `https://database.windows.net/.default` |
| Key Vault | `https://vault.azure.net/.default` |
| Cosmos DB | `https://cosmos.azure.com/.default` |
| Service Bus | `https://servicebus.azure.net/.default` |
| Event Hubs | `https://eventhubs.azure.net/.default` |
| Azure OpenAI | `https://cognitiveservices.azure.com/.default` |
