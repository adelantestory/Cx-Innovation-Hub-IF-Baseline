# [PROJECT_NAME]

**Microsoft Innovation Factory**

## Instructions for Claude Code

This template provides the public README for the Innovation Factory POC repository. Copy this file to `concept/README.md` and populate all `[PLACEHOLDER]` values with actual information. The README should enable external developers to understand, deploy, and extend the solution. Remove this instructions section after populating.

---

## Overview

[PROJECT_DESCRIPTION]

This project was created as part of Microsoft's **Innovation Factory** program, which helps customers rapidly prototype and validate AI-powered solutions on Azure.

### Key Features

- [FEATURE_1]
- [FEATURE_2]
- [FEATURE_3]

## Architecture

```mermaid
[ARCHITECTURE_DIAGRAM]
```

### Components

| Component | Technology | Description |
|-----------|------------|-------------|
| [COMPONENT_1] | [TECHNOLOGY] | [DESCRIPTION] |
| [COMPONENT_2] | [TECHNOLOGY] | [DESCRIPTION] |

### Azure Services

| Service | Purpose |
|---------|---------|
| [SERVICE_1] | [PURPOSE] |
| [SERVICE_2] | [PURPOSE] |

## Prerequisites

Before deploying this solution, ensure you have:

- [ ] Azure subscription with appropriate permissions
- [ ] Azure CLI installed and configured
- [ ] [IaC_TOOL] installed (version [VERSION]+)
- [ ] [ADDITIONAL_PREREQUISITES]

### Required Azure Resource Providers

The following resource providers must be registered in your subscription:

```bash
az provider register --namespace Microsoft.[PROVIDER_1]
az provider register --namespace Microsoft.[PROVIDER_2]
```

## Getting Started

### 1. Clone the Repository

```bash
git clone [REPOSITORY_URL]
cd [PROJECT_FOLDER]
```

### 2. Configure Environment

Copy the configuration template and update with your values:

```bash
cp AZURE_CONFIG.json.example AZURE_CONFIG.json
```

Update the following values in `AZURE_CONFIG.json`:

| Setting | Description |
|---------|-------------|
| `subscription.id` | Your Azure subscription ID |
| `subscription.tenantId` | Your Azure AD tenant ID |
| [ADDITIONAL_CONFIG] | [DESCRIPTION] |

### 3. Deploy Infrastructure

```bash
cd infrastructure
./deploy.sh
```

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 4. Deploy Applications

[APPLICATION_DEPLOYMENT_STEPS]

## Configuration

### Environment Configuration

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| [VAR_1] | Yes | [DESCRIPTION] | - |
| [VAR_2] | No | [DESCRIPTION] | [DEFAULT] |

For complete configuration documentation, see [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Directory Structure

```
[PROJECT_ROOT]/
├── apps/                    # Application source code
│   └── [APP_NAME]/          # [APP_DESCRIPTION]
├── docs/                    # Documentation
│   ├── ARCHITECTURE.md      # Architecture details
│   ├── CONFIGURATION.md     # Configuration guide
│   ├── DEPLOYMENT.md        # Deployment runbook
│   └── DEVELOPMENT.md       # Developer guide
├── infrastructure/          # Infrastructure as Code
│   ├── deploy.sh            # Deployment script
│   ├── terraform/           # Terraform modules
│   └── bicep/               # Bicep templates
├── sql/                     # Database scripts
├── AZURE_CONFIG.json        # Azure configuration
└── README.md                # This file
```

## Security

### Authentication

This solution uses **Azure Managed Identity** for all service-to-service authentication. No connection strings or access keys are stored in the codebase.

### Identity & Access

| Identity | Type | Purpose | Assigned Roles |
|----------|------|---------|----------------|
| [IDENTITY_1] | User-Assigned Managed Identity | [PURPOSE] | [ROLES] |

### Network Security

[NETWORK_SECURITY_DESCRIPTION]

## Development

For local development setup and coding guidelines, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Known Limitations

This is a **functional prototype** created during a time-boxed Innovation Factory engagement. The following limitations apply:

| Limitation | Production Recommendation |
|------------|---------------------------|
| [LIMITATION_1] | [RECOMMENDATION] |
| [LIMITATION_2] | [RECOMMENDATION] |

## Contributing

This project was created for [CUSTOMER_NAME] as part of Microsoft's Innovation Factory program. For questions about extending this solution, contact:

- [CONTACT_INFO]

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Microsoft Innovation Factory** | Rapid prototyping for enterprise AI solutions
