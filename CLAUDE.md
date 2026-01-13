# Azure Innovation Factory Implementation Team

## Overview

This project uses a team of specialized AI agents to architect, develop, and deploy Azure solutions within Microsoft's locked-down internal Azure subscription environment. All agents understand the constraints of Microsoft internal Azure environments, including mandatory managed identity usage, restricted access patterns, and compliance requirements.

## Context
**CRITICAL: All agents MUST read the `.claude/context/INNOVATION_FACTORY.md` to understand the goals and procedures of the Innovation Factory program.**

**CRITICAL: The Spec Kit constitution (`.specify/memory/constitution.md`) establishes non-negotiable principles for all technical decisions and must be followed throughout the engagement.**

Agents must be familiar with the Innovation Factory in order to build in alignment with its priorities and principles. Doing so will prevent scope creep, eliminate unnecessary code bloat, and ensure that a solid, functioning POC is constructed that meets the customer's requirements.

## Critical Constraints

### Microsoft Internal Azure Environment Restrictions
- **NO connection strings** - All services must use Managed Identity authentication
- **NO access keys** - Use RBAC and identity-based access control
- **Resource providers may need explicit registration** - Coordinate with subscription-expert
- **Strict networking requirements** - Private endpoints preferred, public access restricted
- **Compliance tagging required** - All resources must have appropriate tags
- **Naming conventions enforced** - Follow Microsoft internal naming standards

### Customer Technology Alignment
- **Use the customer's preferred technology stack** — do not impose alternatives
- If customer has no preference, recommend based on simplicity and Microsoft best practices
- Document rationale for any technology choices in ARCHITECTURE.md

## Service Constraints
Each service architect will maintain a set of constraints for the environment. All service agents must review constraints with their respective service architect before recommending and/or implementing a solution.

### Execution Policy
**CRITICAL: No agent may execute Azure CLI, PowerShell, Terraform, or Bicep commands directly.**

When Claude Code is started, the user must first be asked which process stage the project is currently on. Then, the agents must immediately learn and be aware of the requirements and deliverables of each stage as detailed below. 

Additionally, any agent may call any other agent, however, only one instance of a specific agent may execute at a time to ensure there is no duplication or conflict in instructions.

All commands that need to be executed against Azure must be:
1. Documented clearly in the appropriate output
2. Provided to the user for manual execution
3. Include any prerequisites or sequence requirements
4. Any configuration changes must be reflected in the documentation, including updating scripts (SSL, terraform, bicep, etc.)

## Escalation Procedures

When an agent encounters a blocker:
1. Document the blocker and attempted solutions
2. Escalate to `cloud-architect` for technical blockers
3. Escalate to `project-manager` for scope/requirement blockers
4. If unresolved after 10 minutes of investigation, expand search to web
5. If unresolved after 30 minutes of investigation, flag to human
6. Do NOT proceed with workarounds without human approval

## Project Structure

```bash
/
├── CLAUDE.md                    # This file
├── artifacts/                   # Reference documentation and images that have been provided by the customer
├── deliverables/                # Client-facing deliverables
│   ├── AS_BUILT.md              # As-built document describing the final solution and its architecture
│   ├── COST_ESTIMATE.md         # Cost analysis
│   ├── POST_MORTEM.md           # Project retrospective
│   ├── SCOPE_OF_WORK.md         # Scope of work documents
│   └── FINAL_DELIVERY.pptx      # Final presentation
├── concept/                     # Client-facing deliverables (this folder and its contents will be under git)
│   ├── .specify/                # Spec kit files
│   ├── AZURE_CONFIG.json        # Central configuration (updated and referenced by each 'deploy.sh' script)
│   ├── docs/                    # Implementation documentation
│   │   ├── ARCHITECTURE.md      # Architecture document
│   │   ├── CONFIGURATION.md     # Service configuration guide
│   │   ├── DEPLOYMENT.md        # Deployment runbooks
│   │   └── DEVELOPMENT.md       # Development guide
│   ├── apps/                    # Application source code
│   ├── infrastructure/          # Infrastructure 
│   │   ├── deploy.sh            # Multi-staged deployment script for infrastructure
│   │   ├── terraform/           # Terraform modules
│   │   └── bicep/               # Bicep templates
│   └── sql/                     # SQL DDL scripts
│       ├── 001_create_tables.sql        # DDL script for creating tables
│       ├── 002_create_views.sql         # DDL script for creating views
│       ├── 003_create_sprocs.sql        # DDL script for creating stored procedures
│       ├── 004_create_udfs.sql          # DDL script for user-defined functions
│       └── 005_seed_data.sql            # DDL script for seeding tables with data
└── .claude/                     # Claude's configuration
    ├── agents/                  # Agent definitions
    ├── context/                 # Context for the Innovation Factory program
    │   └── INNOVATION_FACTORY.md        # Full description of the Innovation Factory program
    ├── skills/                  # Skill definitions
    └── templates/               # Templates used by agents and skills to produce specific deliverables
```

## Project Documentation
All standard project documentation **MUST** use the templates provided. Where the instructions below reference the project documentation, Claude must _copy_ the template to the project folder and provide the content as instructed.

| Project Document | Template Path |
| --- | --- |
| .specify/memory/constitution.md | _(Pre-populated - do not modify)_ |
| deliverables/AS_BUILT.md | .claude/templates/AS_BUILT.md |
| deliverables/COST_ESTIMATE.md | .claude/templates/COST_ESTIMATE.md |
| deliverables/POST_MORTEM.md | .claude/templates/POST_MORTEM.md |
| deliverables/SCOPE_OF_WORK.md | .claude/templates/SCOPE_OF_WORK.md |
| concept/AZURE_CONFIG.json | .claude/templates/AZURE_CONFIG.json |
| concept/docs/ARCHITECTURE.md | .claude/templates/ARCHITECTURE.md |
| concept/docs/CONFIGURATION.md | .claude/templates/CONFIGURATION.md |
| concept/docs/DEPLOYMENT.md | .claude/templates/DEPLOYMENT.md |
| concept/docs/DEVELOPMENT.md | .claude/templates/DEVELOPMENT.md |

## Time Constraint
**CRITICAL: Innovation Factory engagements are limited to a MAXIMUM of 10 days.**

- Do not over-engineer solutions
- Prioritize working functionality over perfection
- If a feature cannot be completed within the time constraint, recommend descoping rather than extending
- Agents should flag time concerns to `project-manager` immediately

## Prototype Mindset
**REMINDER: All Innovation Factory deliverables are FUNCTIONAL PROTOTYPES, not production-ready solutions.**

- Implement the minimum viable solution that demonstrates the concept
- Document shortcuts and their production implications rather than implementing production-grade features
- Security hardening is advisory (documented) not implemented
- Production-grade error handling, logging, and monitoring are out of scope unless explicitly required

## Scope Management
**CRITICAL: Scope creep is the most common cause of failed POCs.**

- Any request that expands beyond the approved SOW must be flagged to `project-manager`
- `project-manager` must inform the human before any scope expansion work begins
- New requirements discovered during implementation should be documented for "Phase 2" rather than implemented
- When in doubt, ask: "Is this required to demonstrate the core value proposition?"

## Version Control

- All code in `concept/` folder is under git version control
- Human will be responsible for **manually** committing and pushing code
- With the exception of the `AZURE_CONFIG.json`, do not store customer name, secrets, connection strings, or sensitive configuration
- At no point should **ANYTHING** in the `concept/` folder contain information that identifies the customer or private trade information. This includes documentation (in the `concept/docs/` folder) and Spec Kit documentation. The only exception to this rule is the `AZURE_CONFIG.json`, which will be ignored on check-in.
- The `concept/` folder should be deployable from a fresh clone

## Required Process
**CRITICAL:** In order to ensure consistency across all _Innovation Factory_ engagements, the following process **MUST** be followed. There are **NO EXCEPTIONS**.

The process is defined in the subsections below. Some of this process, especially the initial stages, will require significant human interaction. This interaction is necessary to maximize clarify and alignment with the customer's objectives while minimizing confusion in the implementation during the latter stages.

| Phase | Process Stage |
| ---   | ---           |
| Phase 1: Strategy Briefing / A Day in the Life (1 day) | Stage 1: Customer Discovery <br /> Stage 2. Scope of Work Generation <br /> Stage 3. Customer Sign-Off and Approval |
| Phase 2: Prototyping (2-4 days) | Stage 4. Agent Discovery <br /> Stage 5. Design Architecture <br /> Stage 6. Create Deployment Plan <br /> Stage 7. Build Infrastructure & Applications <br /> Stage 8. Deploy Infrastructure </br> Stage 9. Deploy Application Components |
| Phase 3: Validate (1-2 days) | Stage 10. Testing & Validation |
| Phase 4: Improve (1-2 days) | Stage 11. Refactoring & Improvement |
| Phase 5: Evaluate (1 day) | Stage 12. Prepare Final Deliverables |
| Phase 6: Hand Off (ongoing) | _None._ |

There are two generic parties referenced in the process below:
- Human: a live person, usually required for interaction or providing additional context
- Agent: an agent that is responsible for carrying out a function. Note that a specific agent may or may not be reference. If a specific agent is not mentioned, the most appropriate agent must be selected to perform the task according to the **Agent Delegation Rules** in the section following.

**IMPORTANT:** Agents are **NOT** allowed to move forward to the next stage until given permission to do so.

### 1. Customer Discovery
Human performs discovery with the customer. This may involve whiteboarding sessions, architecture design sessions, a day-in-the-life engagement, or simply a business analysis exercise with the customer. As available, the human will record all interactions with the customer and generate transcripts automatically. Those transcripts will be provided, and the human will designate which speakers are Microsoft staff and which represent the customer.

All discovery material, including transcripts, other documentation, images, etc., will be placed in the artifacts folder so that agents can reference it at any time during the process.

**Deliverables:** Transcripts, Images, Any additional documentation

### 2. Scope of Work Generation
At this stage, the human will interact with the `project-manager`, `business-analyst`, `cloud-architect`, and other service agents, based on the project requirements, to craft a scope of work.

The agents will examine all artifacts provided (in the `artifacts/` folder) to understand what the customer is seeking to implement. Based on the content, the agents will engage with the human to generate a scope of work. The engagement will remain high-level to flush out any major gaps in the agents' understanding. The agents will seek to specifically identify objects, the scope of the project (including what's in and out of scope), deliverables, responsibilities (for both Microsoft and the customer), assumptions, dependencies, and success criteria. The `business-analyst` will also craft an executive summary based on the findings.

This process is iterative but should take no more than an hour or so to complete. The responsible agents should seek to thoroughly understand the scope of work. At this stage, the technical implementation isn't highly important. Instead, it's simply defining the scope of work, which should mostly be gathered from the provided artifacts. While the agents can ask questions, those questions should only be for purpose of clarifying desired outcomes.

Once all necessary information is obtained, the agents will communicate their findings to the `document-writer` who will capture it in the designated sections of the `.claude/templates/SCOPE_OF_WORK.md` and save it as a new file: `deliverables/SCOPE_OF_WORK.md`.

**Deliverables:** Scope of Work (`deliverables/SCOPE_OF_WORK.md`)

### 3. Customer Sign-Off and Approval
The scope of work is transferred by a human to a formal Word document and shared with the customer. The customer and the human work together to ensure there is an alignment in expectations. This may require some modifications to the scope of work generated in step 2, but all of these changes will be captured in the formal Word document (the `deliverables/SCOPE_OF_WORK.md` will remain unchanged). Once alignment has been reached, the document is finalized, and the customer has approved the scope of work, the Word document will be stored in the `deliverables/` folder. The document could be named anything, but the _preferred_ naming convention is `MM-dd <customer>.docx`.

At this stage, there is nothing needed from the agents.

**Deliverables:** A formal scope of work document in Word format that has been agreed upon by the customer and Microsoft

### 4. Agent Discovery
This is stage is highly iterative, and the discussion between the agents and the human is in-depth. At this stage, the `project-manager`, `business-analyst`, and `cloud-architect` will examine all documents in the `artifacts/` folder. This will include the formal scope of work document completed in stage 3. After doing so, the team will engage the human and ask very specific questions regarding the product that perhaps are not covered in the documentation. These questions can range from technical to functional requirements, as well as any business requirements. Based on the discovered content, the team should engage other agents to ask questions within their domain of expertise. There are no questions considered irrelevant. The team **MUST** ask any pertinent questions and identify all gaps within the project.

During this time, the `project-manager` and `business-analyst` will coordinate with the `spec-kit-expert` to capture all specifications in _Git Spec Kit_ format. Accordingly the `spec-kit-expert` will identify and capture all specifications and document them per Spec Kit's guidelines. They will be stored in the `concept/.specify/` folder.

**Deliverables:**
- Agents must possess a clear understanding of what is being built
- Specifications (requirements and user stories) meticulously documented in the `concept/.specify/` folder in accordance with the Spec Kit workflow

### 5. Design Architecture
Upon the completion of discovery, agents will create and propose a comprehensive architecture for the solution. The human will engage with the agents to adjust the architecture to human and customer preferences. The architecture must satisfy all business requirements as well as function within the security constraints of the Microsoft Azure tenant. Any functionality that does not meet the requirements of security constraints must be rejected.

Agents must prefer simplicity in design. However, they must not sacrifice functionality. When there is a set of comparable solutions, agents must present these solutions to the human, along with pros and cons of each solution, to allow the human to decide.

Once the architecture has been determined, the `cloud-architect` will engage the `document-writer` to create a an architecture document (`concept/docs/ARCHITECTURE.md`) that captures the high-level architecture, workflow pipelines, application life cycles, Azure services infrastructure, data storage architecture, service dependencies, scaling and disaster recovery, error handling and retry logic, interactivity between systems, and reasons why specific solutions were chosen. The high-level architecture should include a mermaid diagram showing dependencies and connections between components.

**Deliverables:**
- An architecture document (`concept/docs/ARCHITECTURE.md`) describing the architecture and functionality of the project.
- A cost estimate (`deliverables/COST_ESTIMATE.md`) describing all services in Azure based on three tiers of utilization: low, medium, and high.

### 6. Create Deployment Plan
Once the architecture document has been developed, the `cloud-architect` will engage all agent experts to craft the detailed configuration document (`concept/docs/CONFIGURATION.md`) through the `document-writer`. The guide must be meticulous and comprehensive, and it should describe the full configuration and implementation of the required Azure services. Ensure all configuration (e.g., environment variables) are included.

**Deliverables:** The configuration and implementation guide of the required Azure services (`concept/docs/CONFIGURATION.md`)

### 7. Build Infrastructure & Applications

#### Infrastructure
Based on the architecture (`concept/docs/ARCHITECTURE.md`) and configuration (`concept/docs/CONFIGURATION.md`), as well as the artifacts (`artifacts/`), the `cloud-architect` will engage the necessary agents to construct the required terraform and/or bicep modules. Modules must follow DRY and SOLID design principals--no mono module design.

Terraform modules will be stored in `concept/infrastructure/terraform`.
Bicep modules will be stored in `concept/infrastructure/bicep`.

The `cloud-architect` must plan a **STAGED** deployment process in that services are deployed together in accordance with like domain, application layer, or purpose. This is to ensure that a specific stage can be redeployed at any time without requiring a full redeployment of the infrastructure.

The `cloud-architect` will also construct a deployment script (`concept/infrastructure/deploy.sh`) that will enable the human to deploy the environment via a set of variables. Those variables must include, at a minimum, the following:

- `-location` (`--l`) - the location to deploy the Azure services (e.g., eastus, northeurope).
- `-uid` (`--u`) - the unique, root identifier of all services (e.g., 'my-app'). From this value, services will derive their name (e.g, 'rg-my-app-data' for resource group containing data components, 'appsvc-my-app-func' for app service dedicated to an Azure functions instance).
- `-environment` (`--e`) - the environment which to deploy the services ['dev', 'stg', 'prd'] for Development, Staging, or Production, respectively.
- `-stage` (`--s`) - the stage number to deploy, facilitating the multi-stage deployment requirement

**CRITICAL:** All resource labels should include stage, environment, and purpose (e.g., data, functions, etc.)

**CRITICAL:** Deployment script must reference the Azure configuration JSON file (`concept/AZURE_CONFIG.json`) for all stages as well as update the file upon each deployment with the appropriate values.

#### Applications

At this stage, the `cloud-architect` will also engage all necessary agents to write the code for the applications. The code **MUST** follow all DRY and SOLID design principles. Absolutely, no monolithic code is acceptable. Additionally, all methods, functions, and procedures must follow a single-responsibility design. Code simplicity, readability, and maintainability are HIGH priority.

All apps should be developed as independent solutions in the `concept/apps/` folder. Furthermore, they should have the capacity to be deployed individually (except in specific situations requiring them to be deployed collectively, as in containerization).

The `cloud-architect` must plan a **STAGED** deployment process in that apps are deployed together in accordance with like domain, application layer, or purpose.

Additionally, should the applications require any form of relational database, the `cloud-architect` must engage the appropriate database agent to build the scripts necessary for constructing the data repository. These scripts should include tables, views, procedures, seed data, etc. In the folder structure above, an example has been given the SQL. However, the `cloud-architect` should instruct the appropriate database developer to follow the model for other repositories (e.g., sql, postgres, mysql, mongo, databricks).

Upon completion of building the scripts, modules, and applications, the `cloud-architect` will engage the `document-writer` to build a comprehensive, step-by-step deployment guide (`concept/docs/DEPLOYMENT.md`) that informs and instructs the human how to deploy the environment, including any manual steps. From this point forward, should the deployment process or configuration change, it is **CRITICAL** that the `cloud-architect` informs:
- the `document-writer` so that guides can be updated appropriately
- the appropriate terraform/bicep developers so that modules can be updated
- the appropriate service developers so that source code can be updated
- the appropriate database developers so that database scripts can be updated

**It is ABSOLUTELY CRITICAL that all documentation, scripts, and source code remain up-to-date AT ALL TIMES.**

**Deliverables:**
- Deployment guide (`concept/docs/DEPLOYMENT.md`)
- Development guide (`concept/docs/DEVELOPMENT.md`)
- Deployment script (`concept/infrastructure/deploy.sh`)
- Terraform modules (`concept/infrastructure/terraform/`)
- Bicep modules (`concept/infrastructure/bicep/`)
- Applications (`concept/apps/`)
- (OPTIONAL) DDL scripts (`concept/sql/`)

### 8. Deploy Infrastructure
After the scripts and modules have been developed, human will use the deployment script to deploy each stage of the infrastructure. This process will ensure:
1. All services are deployed fully with the necessary resources available for a region
2. All services are deployed in accordance with Microsoft's security policies

In the case that either requirement fails, the scripts can be modified and ran in a different region.

Human will be responsible for **manually** deploying the environment using the script and modules provided by the agents. If an issue arises, the human will engage the `cloud-architect` to assign the appropriate agent to adjust the configuration. Additionally, the `cloud-architect` will communicate any necessary changes to documentation to the `document-writer`.

**Rollback Procedure:**
1. Document the failure in detail
2. Use `-stage` flag to redeploy only the affected stage
3. If rollback is needed, delete the resource group for that stage and redeploy
4. Update AZURE_CONFIG.json to reflect current state

**Deliverables:**
- The human will deploy the environment to Azure using the scripts and modules
- The appropriate agents will update the scripts, as directed by the `cloud-architect`, to accommodate any necessary changes
- The `document-writer` will update the deployment guide, as directed by the `cloud-architect`, to accommodate any necessary changes

### 9. Deploy Application Components
After the applications have been developed, human will use the deployment and development guides to deploy each application component. If an issue arises, the human will engage the `cloud-architect` to assign the appropriate agent to adjust the application. Additionally, the `cloud-architect` will communicate any necessary changes to documentation to the `document-writer`.

**Deliverables:**
- The human will deploy the applications to Azure using the deployment and development guides
- The appropriate agents will update the source code, as directed by the `cloud-architect`
- The `document-writer` will update the guides, as directed by the `cloud-architect`

### 10. Testing & Validation
Once the application has been built and is functioning, the human will inform the customer. The customer will test the application's features through manual interaction and validation, documenting any shortcomings. The human gathers this feedback.

While the customer performs manual testing, agents can assist by:
- `business-analyst` prepares a validation checklist based on success criteria from SOW
- `document-writer` documents any issues reported by the customer

**Deliverables:** Customer will communicate additional requirements, changes, etc. to human

### 11. Refactoring & Improvement
Human will engage agents to improve the solution based on customer feedback. The `project-manager`, `business-analyst`, and `cloud-architect` should engage in a conversation with the human to adequately understand the changes and to construct a plan to implement those changes. Those agents **MUST** communicate to the human the level and breadth of impact that implementing those changes will make on the underlying system.

Once the changes have been identified, the following **MUST** occur:
1. the `document-writer` must capture all relevant changes in the applicable documentation
2. the `spec-kit-expert` must _append_ requirements to the Spec Kit documentation
3. the `cloud-architect` must assign updates to deployment scripts
4. the `cloud-architect` must assign additional relevant work to the appropriate agents

**Deliverables:**
- All documentation changes updated by the `document-writer`
- All new requirements captured in the Spec Kit documentation by the `spec-kit-expert`
- All deployment scripts have been updated by the `cloud-architect` or the service agents
- Any additional code changes have been completed by agents as assigned by the `cloud-architect`

### 12. Prepare Final Deliverables
At this final stage, the `project-manager` and `cloud-architect` will engage the `document-writer` to produce two documents ("as-built" and post-mortem) as deliverables to the customer. The `project-manager`, `business-analyst`, and `cloud-architect` will examine the two documents to understand what content is required. They will complete the sections based on their knowledge and feedback from other agents. Then, for any questions or gaps in information, they will ask the human for clarification. The `document-writer` should capture all information in the appropriate sections.

These templates can be found in `.claude/templates` but should be copied to the `deliverables/` folder before updating.

- `/deliverables/AS_BUILT.md` - as-built document describing the current, final state of the application and its supporting architecture
- `/deliverables/POST_MORTEM.md` - detailed analysis of what was built, specific gaps, why those gaps exist, how to improve, and additional details for learning from the POC

### Phase 6: Hand Off
The handoff phase is ongoing and managed by the human with Microsoft Customer Success and/or the customer's preferred partner. Agents are not directly involved but may be engaged if questions arise during handoff.

**Pre-Handoff Checklist:**
- `/deliverables/AS_BUILT.md` is complete and accurate
- `/deliverables/POST_MORTEM.md` is complete with all learnings captured
- All source code is in the repository with README files
- `/concept/docs/DEPLOYMENT.md` contains all steps needed to recreate the environment
- `/concept/AZURE_CONFIG.json` reflects the final deployed state
- All known limitations are documented

## Agent Delegation Rules

### Mandatory Agent Usage
**EVERY interaction MUST be handled by the appropriate agent.** There is no "default" mode.

### Agent Selection Priority
1. If the request clearly maps to a specific service + role, delegate to that agent
2. If the request spans multiple services, delegate to `cloud-architect` for coordination
3. If the request is about project scope, requirements, or client communication, delegate to `project-manager`
4. If the request is about discovery or requirements analysis, delegate to `business-analyst`
5. If the request is about documentation, delegate to `document-writer`
6. If the request is about costs, delegate to `cost-analyst`
7. If the request is about spec kit, delegate to `spec-kit-expert`
8. If the request is about subscription-level configuration, delegate to `subscription-expert`
9. **If no appropriate agent can be determined, `project-manager` MUST ask the user who to assign the work to**

### Service Agent Coordination Pattern
For any Azure service implementation, the four service agents work together:
1. **architect** - Designs configuration, security, networking, and identity requirements
2. **developer** - Writes application code to interact with the service
3. **terraform** - Creates Terraform modules for deployment
4. **bicep** - Creates Bicep templates for deployment

### AZURE_CONFIG.json
The `cloud-architect` orchestrates cross-service coordination and is the responsible owner of the `concept/AZURE_CONFIG.json` file. The `concept/AZURE_CONFIG.json` is automatically generated and updated by the various steps of the assorted deployment scripts. Additionally, those same deployment scripts will reference values from previous steps to perform configurations of subsequent steps. The `cloud-architect` maintains any manual updates `concept/AZURE_CONFIG.json`.

## Available Agents

### Support Roles
| Agent | Responsibility |
|-------|---------------|
| `project-manager` | Scope, requirements, coordination, deliverables |
| `business-analyst` | Discovery analysis, requirements, gap identification |
| `cloud-architect` | Cross-service coordination, AZURE_CONFIG.json |
| `subscription-expert` | Subscription configuration, resource providers |
| `spec-kit-expert` | GitHub Spec Kit documentation |
| `document-writer` | Implementation documentation in concept/docs/ |
| `cost-analyst` | Cost estimation in deliverables/ |

### Azure Service Agents
Each service has four agents: `-architect`, `-developer`, `-terraform`, `-bicep`

| Service | Agent Prefix | Description |
|---------|-------------|-------------|
| Azure SQL | `azure-sql-*` | Azure SQL databases |
| Cosmos DB | `cosmos-db-*` | NoSQL database |
| Redis Cache | `redis-cache-*` | In-memory caching |
| Blob Storage | `blob-storage-*` | Object storage |
| Azure Functions | `azure-functions-*` | Serverless compute |
| Web Apps | `web-app-*` | App Service web applications |
| Container Apps Environment | `container-apps-environment-*` | Container Apps hosting environment |
| Container Apps | `container-app-*` | Container applications |
| Container Registry | `container-registry-*` | Docker container registry |
| Service Bus | `service-bus-*` | Message queuing |
| Key Vault | `key-vault-*` | Secrets management |
| Application Insights | `app-insights-*` | Application monitoring |
| User-Managed Identity | `user-managed-identity-*` | Identity management |
| Log Analytics | `log-analytics-*` | Log aggregation and analysis |
| API Management | `api-management-*` | API gateway |
| Azure OpenAI | `azure-openai-*` | AI/ML services |

## AZURE_CONFIG.json Schema

The `cloud-architect` owns this file and, alongside the deployment scripts, maintains it with all project configuration. Copy from `.claude/templates/AZURE_CONFIG.json` to `concept/`. Resources require `name`, `id`, `resourceGroup` at minimum; add SKU, configuration as needed.

```json
{
  "project": { "name": "", "customer": "", "environment": "dev", "createdDate": "", "lastModified": "" },
  "subscription": { "id": "", "name": "", "tenantId": "", "resourceProviders": [] },
  "tags": { "required": ["Environment", "Stage", "Purpose"], "optional": [] },
  "stages": {
    "stage1": {
      "name": "Foundation",
      "description": "Foundational components",
      "resourceGroups": {
        "group1": { "name": "rg-{uid}-foundation", "location": "eastus", "tags": {} }
      },
      "managedIdentities": {},
      "resources": {
        "keyVault": { "name": "", "id": "", "resourceGroup": "" },
        "appInsights": { "name": "", "id": "", "resourceGroup": "" },
        "logAnalytics": { "name": "", "id": "", "resourceGroup": "" }
      }
    },
    "stage2": {
      "name": "Data",
      "description": "Database components",
      "resourceGroups": { "group1": { "name": "rg-{uid}-data", "location": "eastus", "tags": {} } },
      "managedIdentities": {},
      "resources": { "azureSql": {}, "cosmosDb": {}, "redisCache": {} }
    }
  }
}
```

## Spec Kit Integration

The `spec-kit-expert` maintains GitHub Spec Kit documentation:
- `constitution.md` - Project principles and constraints
- `specify.md` - Detailed specifications
- `plan.md` - Implementation plan
- `tasks.md` - Task breakdown
- `implement.md` - Implementation tracking

The `project-manager` coordinates with `spec-kit-expert` to ensure documentation stays current.

## Workflow Examples

### New Service Implementation
```
User: "Add Cosmos DB to the solution"
1. project-manager acknowledges and coordinates
2. cloud-architect designs integration with existing services
3. cosmos-db-architect defines configuration and security
4. cosmos-db-developer writes data access code
5. cosmos-db-terraform OR cosmos-db-bicep creates IaC
6. document-writer captures documentation
7. cost-analyst updates cost estimates
```

### Deployment Preparation
```
User: "Prepare deployment for staging"
1. cloud-architect validates AZURE_CONFIG.json
2. subscription-expert confirms resource providers
3. terraform/bicep agents generate deployment scripts
4. document-writer updates deployment runbook
5. human manually executes changes
```
