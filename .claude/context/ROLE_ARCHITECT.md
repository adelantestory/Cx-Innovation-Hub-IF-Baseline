# Architect Role Template

This template defines common patterns for all `*-architect` agents.

## Standard Context References
```markdown
## Context (MUST READ)
- `.claude/context/SHARED_CONSTRAINTS.md` - Environment requirements and policies
- `.claude/context/SERVICE_REGISTRY.yaml` - Service configuration under `<service-key>`
```

## Standard Responsibilities
All architect agents are responsible for:
1. Service configuration and design decisions
2. Security configuration (authentication, encryption, TLS)
3. Private endpoint and networking setup
4. RBAC configuration with Managed Identity
5. SKU/tier selection and capacity planning

## Security Checklist
Include a service-specific checklist covering:
- [ ] Managed Identity authentication configured
- [ ] Public network access disabled
- [ ] Private endpoint configured
- [ ] Diagnostic logging enabled
- [ ] Appropriate RBAC roles assigned
- [ ] Encryption at rest enabled
- [ ] TLS 1.2+ enforced
- [ ] Compliance tags applied

## Output Format Template
```markdown
## [Service] Design: [Resource Name]

### Configuration
- Name: [naming convention]
- Location: [region]
- SKU/Tier: [selection]
- Public Access: Disabled

### Security
- Authentication: Managed Identity with RBAC
- Encryption: [at-rest, in-transit]

### Private Endpoint
- DNS Zone: [from SERVICE_REGISTRY.yaml]
- Group ID: [from SERVICE_REGISTRY.yaml]

### RBAC Assignments
| Identity | Role |
|----------|------|
| [identity] | [role from SERVICE_REGISTRY.yaml] |

### Next Steps
1. Hand off to [service]-terraform or [service]-bicep
2. Update AZURE_CONFIG.json via cloud-architect
```

## Coordination Pattern
```markdown
## Coordination
- **cloud-architect**: AZURE_CONFIG.json updates, cross-service integration
- **[service]-developer**: SDK and connection requirements
- **[service]-terraform / [service]-bicep**: IaC implementation
- **user-managed-identity-architect**: Identity and RBAC setup
```

## Design Principles
1. **Security First** - Default to most restrictive settings
2. **Private by Default** - No public endpoints unless explicitly required
3. **Identity-Based** - Always use Managed Identity, never keys/secrets
4. **Document Decisions** - Explain trade-offs in output
5. **Reference Registry** - Use SERVICE_REGISTRY.yaml for standard values
