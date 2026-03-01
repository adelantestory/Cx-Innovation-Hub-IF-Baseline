# Statement of Work: Innovation Factory Engagement

---

## Document Information

| Field | Value |
|-------|-------|
| Customer | CDM |
| Engagement Title | Create Taskify -- Team Productivity Platform POC |
| Document Date | February 12, 2026 |
| Version | 1.0 |
| Author | Microsoft Innovation Factory |

---

## 1. Executive Summary

Microsoft will partner with CDM to develop a functional prototype of "Taskify," a team productivity platform that enables Kanban-style task management across projects. The engagement will demonstrate how a modern web application can be rapidly built and deployed on Azure using the customer's preferred technology stack of React, Node.js, and PostgreSQL.

CDM is seeking to validate the feasibility of a collaborative task management tool that allows team members to organize work across projects using visual Kanban boards. The prototype will establish the foundational architecture and core user experience for managing tasks, tracking progress across workflow stages, and enabling team collaboration through comments and task assignments.

Microsoft will deliver a fully functional, cloud-hosted prototype including the complete source code, infrastructure-as-code templates, and comprehensive documentation. This will provide CDM with a working foundation they can evaluate, extend, and ultimately deploy into their own environment for continued development toward a production-ready product.

---

## 2. Background & Objectives

### Background

CDM has identified a need for a team productivity platform that supports Kanban-style project and task management. The initial concept, called "Taskify," is intended to serve as a collaborative workspace where team members can create projects, manage tasks across workflow stages, assign work to team members, and communicate through task-level comments.

This Innovation Factory engagement was initiated to rapidly prototype the core Taskify experience and validate the concept on Azure infrastructure. The prototype will focus on demonstrating the essential user interactions and data persistence patterns needed to support the full product vision, using a simplified user model with predefined team members and sample projects.

### Objectives

- Build a functional Kanban-style task management application with drag-and-drop task cards across standard workflow columns (To Do, In Progress, In Review, Done)
- Implement a project management layer that supports multiple projects, each with its own Kanban board and associated tasks
- Deliver a persistent data layer using PostgreSQL that retains all user activity (task changes, assignments, comments) across sessions
- Enable team collaboration features including task assignment, comment creation, and comment management with ownership-based permissions
- Deploy the complete solution to Azure using Container Apps and Azure Database for PostgreSQL, demonstrating a cloud-native deployment pattern
- Provide all source code, infrastructure-as-code, and documentation necessary for CDM to extend and deploy the solution independently

---

## 3. Scope of Work

### In Scope

- **User Selection**: A landing screen displaying five predefined users (1 Product Manager, 4 Engineers) with click-to-enter access (no authentication)
- **Project Management**: A project list view displaying three pre-seeded sample projects; clicking a project opens its Kanban board
- **Kanban Board**: A board view with four columns (To Do, In Progress, In Review, Done) with drag-and-drop support for moving task cards between columns
- **Task Cards**: Each card displays task details and supports changing status, assigning a user from the predefined user list, and visual highlighting (distinct color) for cards assigned to the currently active user
- **Comments**: Ability to add unlimited comments to a task card, with edit and delete permissions restricted to the comment author
- **Data Persistence**: All data (users, projects, tasks, assignments, comments, status changes) stored in PostgreSQL and persisted across sessions
- **Seed Data**: Pre-populated database with five users, three sample projects, and sample tasks distributed across the Kanban columns
- **Frontend Application**: React-based single-page application
- **Backend API**: Node.js-based REST API
- **Infrastructure-as-Code**: Deployment templates for Azure Container Apps and Azure Database for PostgreSQL
- **Documentation**: Architecture documentation, deployment guide, configuration guide, and development guide

### Out of Scope

- Production deployment into CDM's environment
- User authentication, authorization, or identity provider integration (e.g., Azure AD/Entra ID login)
- User registration or dynamic user creation
- Real-time collaboration features (e.g., WebSockets, live updates across browser sessions)
- Notification systems (email, push, or in-app notifications)
- File attachments on task cards
- Task due dates, priorities, labels, or advanced filtering
- Mobile-responsive or native mobile application design
- Performance optimization or load testing
- Security hardening beyond basic best practices
- Data migration or transformation of existing data
- Ongoing support or managed services post-engagement
- CI/CD pipeline configuration
- Custom domain or SSL certificate configuration

---

## 4. Deliverables

| Deliverable | Description |
|-------------|-------------|
| Taskify Frontend Application | React-based single-page application providing user selection, project list, Kanban board with drag-and-drop, task card management, and comment functionality |
| Taskify Backend API | Node.js REST API providing endpoints for users, projects, tasks, task status management, assignments, and comments with ownership-based permissions |
| Database Schema and Seed Data | PostgreSQL schema definitions (tables, relationships, constraints) and seed scripts for predefined users, sample projects, and sample tasks |
| Infrastructure-as-Code | Deployment templates for provisioning Azure Container Apps and Azure Database for PostgreSQL Flexible Server |
| Hand-Off Documentation | Architecture documentation, deployment runbook, configuration guide, development guide, and recommended next steps for production readiness |

---

## 5. Engagement Timeline

| Phase | Description | Responsibility | Dates |
|-------|-------------|----------------|-------|
| Strategy Briefing / A Day in the Life | Microsoft experts engage with the customer to understand current challenges, identify opportunities for innovation, and define the objective and scope of the prototype. This session establishes alignment on the problem to be solved and the desired outcome. | All | February 12, 2026 |
| Prototyping | Microsoft builds a functional prototype based on the agreed-upon scope, leveraging AI-assisted development and the customer's preferred technology stack. The solution is designed with security-first principles and aligned to the Microsoft Well-Architected Framework. | Microsoft | February 13 - 17, 2026 |
| Validate | The prototype is delivered to a sandbox environment for customer testing and feedback. This phase allows the customer to evaluate the solution against their requirements and provide input for refinement. | CDM | February 18 - 19, 2026 |
| Improve | Microsoft implements priority enhancements and critical changes to the prototype based on customer feedback from the validation phase. | Microsoft | February 19 - 20, 2026 |
| Evaluate | Microsoft and the customer conduct a post-mortem to document learnings, review what was accomplished, and identify next steps for continued development. | All | February 21, 2026 |
| Hand Off | All deliverables -- including source code, documentation, and implementation guidance -- are handed off to the customer's internal team, Microsoft Customer Success, and/or the customer's preferred partner for continued development and production readiness. | Microsoft | TBD |

---

## 6. Roles & Responsibilities

### Customer Point of Contact

| Role | Name | Email |
|------|------|-------|
| Primary Contact | TBD | TBD |
| Technical Contact | TBD | TBD |

### Customer Responsibilities

- Provide a single point-of-contact for collaboration and timely response to questions during the engagement
- Provide clarification on desired Taskify behavior and user experience expectations when questions arise
- Provide feedback on sample data (user names, project names, task examples) or accept Microsoft-generated samples
- Make stakeholders available during the validation phase to test and evaluate the prototype
- Participate in scheduled sessions for validation and evaluation phases
- Assume responsibility for deploying and extending the solution in their own environment post-engagement

### Microsoft Responsibilities

- Provide fast implementation and response times throughout the engagement
- Deliver a fully-functioning prototype including all source code and documentation
- Build the solution upon the principles of Microsoft's Well-Architected Framework
- Develop the prototype using CDM's preferred technology stack (React, Node.js, PostgreSQL)
- Deploy the prototype to Azure Container Apps with Azure Database for PostgreSQL in a Microsoft-managed environment
- Provide architecture documentation and implementation guidance
- Facilitate seamless hand-off to the customer team and Microsoft Customer Success for continued development

---

## 7. Assumptions & Dependencies

- The prototype will be developed and demonstrated in a Microsoft-managed Azure environment, not CDM's tenant
- The solution will be built using React (frontend), Node.js (backend), and PostgreSQL (database) as specified by CDM
- The application will be deployed to Azure Container Apps with Azure Database for PostgreSQL Flexible Server
- All data used in the prototype will be sample/test data; no real customer or production data will be used
- The five predefined users and three sample projects will use placeholder names and data unless CDM provides specific values
- No user authentication is required for this prototype phase; user selection is handled via a simple click-to-enter interface
- Azure Container Apps and Azure Database for PostgreSQL Flexible Server are available and supported in the target Azure region
- Managed Identity authentication will be used for service-to-service communication where supported by the Microsoft internal Azure environment
- CDM stakeholders will be available during the validation phase (February 18-19) to provide timely feedback
- Customer is responsible for deploying the solution to their environment post-engagement

---

## 8. Success Criteria

- The prototype successfully demonstrates Kanban-style task management with drag-and-drop functionality across four workflow columns (To Do, In Progress, In Review, Done)
- Users can select from five predefined users on the landing screen and navigate to a project list, then into individual Kanban boards
- Task cards can be assigned to users, and cards assigned to the currently active user are visually distinguished from other cards
- Users can create, edit, and delete their own comments on task cards, and cannot modify comments made by other users
- All data (tasks, assignments, comments, status changes) persists across browser sessions via PostgreSQL storage
- The application is deployed and accessible via Azure Container Apps in the Microsoft-managed environment
- All source code, infrastructure-as-code, and documentation are delivered and sufficient for CDM to understand, deploy, and extend the solution independently
- CDM team expresses confidence in their ability to deploy, extend, and maintain the solution post-engagement

---

## 9. Limitations & Disclaimers

**Prototype Status.** The deliverables provided under this engagement constitute a functional prototype intended for demonstration and evaluation purposes only. The prototype is not production-ready and should not be deployed in a production environment without additional development, testing, and security hardening.

**No Warranty.** Microsoft provides the prototype and all associated deliverables "as-is" without warranty of any kind, whether express, implied, or statutory, including but not limited to warranties of merchantability, fitness for a particular purpose, title, or non-infringement.

**Security Advisory.** The customer is solely responsible for implementing appropriate security controls, conducting security assessments, and ensuring compliance with applicable regulations and organizational policies before deploying any portion of the prototype in a production environment.

**No Financial Consideration.** This engagement is provided at no cost to the customer. No fees, payments, or other financial consideration have been exchanged between the parties in connection with this engagement.

**Limitation of Liability.** In no event shall Microsoft be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenue, data, or data use, arising out of or related to this engagement, regardless of the theory of liability.

**Intellectual Property.** All source code and documentation produced during this engagement will be made available to the customer. The customer is granted a non-exclusive license to use, modify, and extend the deliverables for their internal business purposes.

**Independent Decision-Making.** The customer acknowledges that any decisions regarding production implementation, partner selection, or continued development are made at the customer's sole discretion and risk.

---

## Approval

This Statement of Work is provided for alignment purposes. A formal approval via email or verbal confirmation is sufficient to proceed.
