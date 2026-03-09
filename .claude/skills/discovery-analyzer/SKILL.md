# Discovery Analyzer Skill

## Purpose

Analyzes customer-provided discovery materials in `artifacts/` to extract requirements, identify technical constraints, understand business objectives, and generate structured inputs for solution design. Accelerates Stages 1-3 of the Innovation Factory delivery pipeline.

## When to Use

- **Stage 1: Discovery** — Initial analysis of customer-provided materials
- **Stage 2: SOW Development** — Extract scope items and success criteria
- **Stage 3: Approval** — Validate understanding with structured requirements
- **Architecture Design** — Identify technical constraints and integration points
- **Gap Analysis** — Compare requirements against proposed solution

## Triggers

- New files added to `artifacts/` folder
- `business-analyst` begins discovery analysis
- `project-manager` requests requirements summary
- `cloud-architect` needs technical constraints
- SOW drafting begins

---

## Artifact Types

### Supported File Types

| Type | Extensions | Analysis Approach |
|------|------------|-------------------|
| Meeting Transcripts | `.txt`, `.md`, `.docx` | Extract action items, decisions, requirements |
| Requirements Docs | `.docx`, `.pdf`, `.md` | Structured extraction of functional/non-functional requirements |
| Architecture Diagrams | `.png`, `.jpg`, `.svg`, `.vsdx` | Identify systems, integrations, data flows |
| Data Samples | `.csv`, `.xlsx`, `.json` | Understand data structures, volumes, quality |
| API Specifications | `.json`, `.yaml`, `.openapi` | Extract endpoints, schemas, authentication |
| Process Flows | `.bpmn`, `.png`, `.pdf` | Identify workflows, decision points, actors |
| Screenshots | `.png`, `.jpg` | Understand current UI, identify pain points |
| Email Threads | `.eml`, `.msg`, `.pdf` | Extract stakeholder concerns, priorities |

---

## Analysis Framework

### 1. Business Context Extraction

Extract from discovery materials:

```markdown
## Business Context

### Problem Statement
[What business problem is the customer trying to solve?]

### Current State
[How does the customer handle this today? What systems are involved?]

### Desired Future State
[What does success look like? What capabilities do they want?]

### Business Drivers
- [Driver 1: e.g., Cost reduction]
- [Driver 2: e.g., Time to market]
- [Driver 3: e.g., Compliance requirement]

### Success Metrics
- [Metric 1: e.g., 50% reduction in processing time]
- [Metric 2: e.g., 99.9% availability]
- [Metric 3: e.g., Support 1000 concurrent users]
```

### 2. Functional Requirements Extraction

```markdown
## Functional Requirements

### Core Capabilities
| ID | Requirement | Priority | Source |
|----|-------------|----------|--------|
| FR-001 | [Requirement description] | Must Have | [Artifact name, page/timestamp] |
| FR-002 | [Requirement description] | Should Have | [Artifact name, page/timestamp] |
| FR-003 | [Requirement description] | Could Have | [Artifact name, page/timestamp] |

### User Stories
- As a [role], I want to [action] so that [benefit]
- As a [role], I want to [action] so that [benefit]

### Use Cases
1. **[Use Case Name]**
   - Actor: [Who initiates]
   - Trigger: [What starts the use case]
   - Flow: [Step-by-step process]
   - Outcome: [Expected result]
```

### 3. Non-Functional Requirements Extraction

```markdown
## Non-Functional Requirements

### Performance
- Response time: [e.g., < 2 seconds for API calls]
- Throughput: [e.g., 1000 requests/minute]
- Data volume: [e.g., Process 10GB daily]

### Scalability
- Concurrent users: [e.g., 500 simultaneous]
- Growth projection: [e.g., 2x over 12 months]

### Availability
- Uptime requirement: [e.g., 99.9%]
- Maintenance windows: [e.g., Sundays 2-4 AM]
- DR requirements: [e.g., RPO 1 hour, RTO 4 hours]

### Security
- Authentication: [e.g., Azure AD, SSO]
- Authorization: [e.g., Role-based, attribute-based]
- Data classification: [e.g., Confidential, PII present]
- Compliance: [e.g., SOC2, HIPAA, GDPR]

### Integration
- Systems to integrate: [List systems]
- Protocols: [e.g., REST, SOAP, Event-driven]
- Data formats: [e.g., JSON, XML, CSV]
```

### 4. Technical Constraints Extraction

```markdown
## Technical Constraints

### Infrastructure
- Cloud provider: [e.g., Azure only, hybrid]
- Regions: [e.g., US East only, GDPR regions]
- Network: [e.g., Private endpoints required, VPN]

### Technology Stack
- Languages: [e.g., Python preferred, no Java]
- Frameworks: [e.g., .NET Core, React]
- Databases: [e.g., Must use existing SQL Server]

### Organizational
- Deployment: [e.g., CI/CD via Azure DevOps]
- Approval process: [e.g., CAB required for prod]
- Support model: [e.g., Customer owns post-handoff]

### Existing Systems
| System | Role | Integration Type | Owner |
|--------|------|------------------|-------|
| [System 1] | [Purpose] | [API/File/Event] | [Team] |
| [System 2] | [Purpose] | [API/File/Event] | [Team] |
```

### 5. Stakeholder Analysis

```markdown
## Stakeholders

| Name | Role | Interest | Influence | Key Concerns |
|------|------|----------|-----------|--------------|
| [Name] | [Title] | [High/Med/Low] | [High/Med/Low] | [Main concerns] |

### Decision Makers
- [Name]: [What decisions they make]

### Technical Contacts
- [Name]: [Area of expertise]

### End Users
- [User group]: [How they'll use the solution]
```

---

## Procedures

### 1. Initial Artifact Inventory

```bash
# List all artifacts
find artifacts/ -type f | head -50

# Categorize by type
echo "=== Documents ==="
find artifacts/ -type f \( -name "*.docx" -o -name "*.pdf" -o -name "*.md" -o -name "*.txt" \)

echo "=== Images/Diagrams ==="
find artifacts/ -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.svg" \)

echo "=== Data Files ==="
find artifacts/ -type f \( -name "*.csv" -o -name "*.xlsx" -o -name "*.json" \)

echo "=== API Specs ==="
find artifacts/ -type f \( -name "*.yaml" -o -name "*.openapi*" \)
```

### 2. Transcript Analysis

For meeting transcripts, extract:

```markdown
## Transcript Analysis: [Filename]

### Key Decisions
1. [Decision made, who made it, context]

### Action Items
| Item | Owner | Due | Status |
|------|-------|-----|--------|
| [Action] | [Name] | [Date] | Pending |

### Requirements Mentioned
- [Requirement with timestamp/context]

### Concerns Raised
- [Concern and who raised it]

### Technical Details
- [Any technical specifics mentioned]

### Follow-up Questions
- [Questions to clarify with customer]
```

### 3. Diagram Analysis

For architecture/process diagrams:

```markdown
## Diagram Analysis: [Filename]

### Systems Identified
| System | Type | Description |
|--------|------|-------------|
| [Name] | [Database/API/UI/Service] | [Purpose] |

### Data Flows
| From | To | Data | Protocol |
|------|-----|------|----------|
| [Source] | [Destination] | [What data] | [How] |

### Integration Points
- [Integration 1: description]
- [Integration 2: description]

### Gaps/Questions
- [What's unclear or missing from diagram]
```

### 4. Data Sample Analysis

For CSV/Excel/JSON data files:

```markdown
## Data Analysis: [Filename]

### Structure
- Records: [count]
- Fields: [count]
- File size: [size]

### Schema
| Field | Type | Sample | Notes |
|-------|------|--------|-------|
| [name] | [string/int/date] | [example] | [nullable, PII, etc.] |

### Data Quality
- Completeness: [% of fields populated]
- Consistency: [Issues found]
- PII Present: [Yes/No, what types]

### Volume Implications
- Storage estimate: [Based on sample]
- Processing considerations: [Any challenges]
```

### 5. Generate Requirements Summary

Compile all findings into structured output:

```bash
# Create requirements summary file
cat > artifacts/DISCOVERY_SUMMARY.md << 'EOF'
# Discovery Summary

## Document Generated
Date: $(date +%Y-%m-%d)
Artifacts Analyzed: [count]

## Executive Summary
[2-3 paragraph summary of what customer needs]

## Business Context
[Extracted business context]

## Functional Requirements
[Prioritized list]

## Non-Functional Requirements
[Categorized list]

## Technical Constraints
[List of constraints]

## Key Stakeholders
[Stakeholder summary]

## Risks and Concerns
[Identified risks]

## Recommended Next Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Open Questions
- [Question 1]
- [Question 2]
EOF
```

---

## Output Artifacts

This skill produces:

| Output | Location | Purpose |
|--------|----------|---------|
| `DISCOVERY_SUMMARY.md` | `artifacts/` | Consolidated findings |
| Requirements input | `deliverables/SCOPE_OF_WORK.md` | Feeds SOW development |
| Technical constraints | `concept/.specify/memory/constitution.md` | Informs solution constraints |
| Stakeholder map | `artifacts/STAKEHOLDERS.md` | Communication planning |
| Open questions | `artifacts/QUESTIONS.md` | Follow-up with customer |

---

## Integration with Agents

| Agent | Receives From Skill |
|-------|---------------------|
| `project-manager` | Discovery summary, stakeholder map, timeline inputs |
| `business-analyst` | Detailed requirements, use cases, success metrics |
| `cloud-architect` | Technical constraints, integration points, NFRs |
| `document-writer` | Structured content for SOW and deliverables |
| `cost-analyst` | Volume estimates, scalability requirements |

---

## Quality Checklist

Before completing discovery analysis:

- [ ] All artifacts in `artifacts/` folder have been reviewed
- [ ] Business problem is clearly articulated
- [ ] At least 5 functional requirements identified
- [ ] Non-functional requirements captured (performance, security, compliance)
- [ ] Technical constraints documented
- [ ] Key stakeholders identified with contact info
- [ ] Integration points mapped
- [ ] Open questions listed for customer follow-up
- [ ] Summary reviewed for 10-day prototype feasibility
- [ ] Out-of-scope items identified for SOW
