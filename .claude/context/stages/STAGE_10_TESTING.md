# Stage 10: Testing & Validation

**Phase:** 3 - Validate  
**Duration:** 1-2 days  
**Primary Actor:** Customer (via Human)  
**Supporting Agents:** `business-analyst`, `document-writer`

## Overview

Once the application is functioning, the customer tests features through manual interaction and validation. Human gathers feedback for potential improvements.

## Process

1. **Customer Notification**
   - Human informs customer that POC is ready for testing
   - Provides access instructions and credentials

2. **Customer Testing**
   - Customer tests application features manually
   - Customer validates against success criteria from SOW
   - Customer documents shortcomings, missing features, failed implementations

3. **Feedback Collection**
   - Human gathers all customer feedback
   - Organizes feedback by category (bugs, enhancements, missing features)

4. **Agent Support**
   - `business-analyst` prepares validation checklist based on SOW success criteria
   - `document-writer` documents any issues reported by customer
   - Agents remain available for quick clarifications on expected behavior

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| `business-analyst` | Prepare validation checklist from SOW |
| `document-writer` | Document reported issues |
| All agents | Available for clarifications |

## Validation Checklist

`business-analyst` creates checklist from SOW including:
- [ ] Each success criterion from SOW
- [ ] Each deliverable from SOW
- [ ] Each functional requirement
- [ ] Expected behavior for each feature

## Feedback Categories

| Category | Description | Action |
|----------|-------------|--------|
| Bugs | Application not working as designed | Fix in Stage 11 |
| Enhancements | Working but could be better | Evaluate for Stage 11 |
| Missing Features | Not implemented but in scope | Implement in Stage 11 |
| Out of Scope | Not in SOW | Document for Phase 2 |

## Deliverables

| Deliverable | Location | Owner |
|-------------|----------|-------|
| Validation Checklist | _(Working document)_ | `business-analyst` |
| Issue Documentation | _(Working document)_ | `document-writer` |
| Customer Feedback | _(Collected by human)_ | Human |

## Exit Criteria

- [ ] Customer has tested all features
- [ ] All feedback collected
- [ ] Feedback categorized
- [ ] Issues documented
- [ ] Ready for refactoring decisions

## Next Stage

Proceed to **Stage 11: Refactoring & Improvement** when feedback is collected.
