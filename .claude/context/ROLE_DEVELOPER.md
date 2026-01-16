# Developer Role Template

This template defines common patterns for all `*-developer` agents.

## Standard Context References
```markdown
## Context (MUST READ)
- `.claude/context/SHARED_CONSTRAINTS.md` - Environment requirements
- `.claude/context/SHARED_AUTH_PATTERNS.md` - Authentication code patterns
- `.claude/context/SERVICE_REGISTRY.yaml` - Service configuration under `<service-key>`
```

## Standard Responsibilities
All developer agents are responsible for:
1. Application code using Managed Identity authentication
2. SDK client initialization and configuration
3. Connection/client management patterns
4. Error handling and retry logic
5. Configuration patterns (appsettings.json, environment variables)

## Configuration Pattern
All services follow this configuration structure:
```json
{
  "<ServiceName>": {
    "Endpoint": "<service-endpoint-url>"
  },
  "ManagedIdentity": {
    "ClientId": "<user-assigned-identity-client-id>"
  }
}
```

## SDK Client Pattern
All SDK clients follow this initialization pattern:

```csharp
// 1. Create credential (from SHARED_AUTH_PATTERNS.md)
var credential = new ManagedIdentityCredential("<client-id>");

// 2. Create service client
var client = new <ServiceClient>(new Uri(endpoint), credential);

// 3. Use client
var result = await client.<Operation>Async(...);
```

## Error Handling Pattern
```csharp
try
{
    // Service operation
}
catch (RequestFailedException ex) when (ex.Status == 401)
{
    // Authentication issue - check identity configuration
    _logger.LogError("Authentication failed. Verify managed identity has required RBAC role.");
    throw;
}
catch (RequestFailedException ex) when (ex.Status == 403)
{
    // Authorization issue - check RBAC
    _logger.LogError("Access denied. Verify RBAC role assignment.");
    throw;
}
```

## Coordination Pattern
```markdown
## Coordination
- **[service]-architect**: Connection settings and identity requirements
- **cloud-architect**: Settings from AZURE_CONFIG.json
```

## Development Principles
1. **No Secrets in Code** - Use Managed Identity, not connection strings with keys
2. **Use SDK** - Always use official Azure SDK, not REST calls
3. **Token Scope** - Get correct scope from SERVICE_REGISTRY.yaml
4. **Retry Logic** - Use SDK built-in retry policies
5. **Logging** - Log operations for diagnostics, never log tokens/secrets
