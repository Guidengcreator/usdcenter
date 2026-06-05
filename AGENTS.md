# УЗД Эксперт — Project Agent Instructions

## Project Mission

УЗД Эксперт is a production-oriented web application for a real ultrasound diagnostic center.

The goal of the project is to deliver a reliable, maintainable, secure, and well-tested application while using modern AI-assisted software development practices.

The application is intended for real-world usage and should be treated as a production system.

---

# Source Documents

Before implementing any feature, contributors and AI agents must consult:

1. Product Brief
2. Features and User Stories
3. Technical Design

These documents are the source of truth.

Requirements must not be invented.

Features must not be implemented unless they are explicitly approved.

---

# Skills

Reusable engineering processes are stored in:

```text
.skills/
```

Agents should consult relevant skills before performing work.

Examples:

* gherkin-test-design.md
* backend-tdd.md
* user-story-implementation.md
* architecture-review.md
* pull-request-review.md
* api-design.md
* documentation-sync.md

Skills define how recurring engineering tasks should be performed.

---

# Human Roles

## Product Owner

Responsible for:

* product vision,
* feature prioritization,
* requirements approval,
* release planning.

Assigned to:

* Yan Kostylenko

---

## Tech Lead

Responsible for:

* architecture decisions,
* technology decisions,
* code review,
* technical approval.

Assigned to:

* Yan Kostylenko

---

# AI Roles

## Architecture Advisor

Responsible for:

* architecture review,
* design discussions,
* tradeoff analysis,
* documentation support.

Typical agent:

* ChatGPT

---

## Backend Developer

Responsible for:

* Fastify API,
* PostgreSQL,
* Drizzle ORM,
* backend integration tests.

Typical agent:

* Codex

---

## Frontend Developer

Responsible for:

* React application,
* UI implementation,
* frontend integration.

Typical agent:

* Codex

---

## QA Engineer

Responsible for:

* acceptance verification,
* test coverage review,
* regression prevention.

Typical agents:

* ChatGPT
* Codex

---

# Decision Authority

Only the Product Owner and Tech Lead may approve:

* new features,
* architecture changes,
* technology changes,
* release scope changes.

AI agents may propose changes but may not approve them.

---

# Architecture Rules

The following rules are mandatory:

* Keep architecture simple.
* Prefer explicit code over abstraction.
* Avoid premature optimization.
* Favor readability over cleverness.
* Backend owns business logic.
* Frontend never accesses the database directly.
* Database access occurs through Drizzle ORM.
* Public and admin functionality must remain clearly separated.
* Security validation must be performed on the backend.
* API versioning must be used.
* Documentation must remain synchronized with implementation.

---

# Development Workflow

Features are implemented in the following order:

```text
Feature
→ User Story
→ Technical Tasks
→ Tests
→ Implementation
→ Review
```

Do not implement multiple unrelated features simultaneously.

Keep changes small and incremental.

---

# Testing Rules

Backend development follows Gherkin-driven Test-Driven Development.

Required workflow:

```text
User Story
→ Acceptance Criteria
→ Gherkin Scenarios
→ Integration API Tests
→ Implementation
```

Required process:

1. Read User Story.
2. Read Acceptance Criteria.
3. Generate Gherkin scenarios.
4. Review scenarios.
5. Create integration API tests from Gherkin scenarios.
6. Verify tests fail.
7. Implement minimum solution.
8. Verify tests pass.
9. Refactor if necessary.

Integration API tests are preferred over isolated unit tests for business functionality.

No implementation should begin until:

```text
Acceptance Criteria
→ Gherkin Scenarios
→ Integration Tests
```

have been created.

---

# Gherkin Specifications

Gherkin specifications are stored in:

```text
tests/specifications/
```

Every Acceptance Criterion must be represented by at least one Gherkin scenario.

Gherkin specifications serve as the source for integration API tests.

Preferred structure:

```text
tests/
└── specifications/
    ├── appointments/
    ├── admin/
    └── clinic/
```

Example:

```text
tests/specifications/appointments/us-2.1-submit-appointment-request.feature
```

---

# Documentation Rules

When requirements change:

* update Product Brief,
* update Features and User Stories.

When architecture changes:

* update Technical Design.

When new APIs are introduced:

* update API documentation.

Documentation must remain synchronized with implementation.

---

# Git Workflow

## Branch Naming

Branches should be created from the main branch.

Naming convention:

```text
feature/<story-id>-<short-description>
bugfix/<issue-id>-<short-description>
docs/<short-description>
refactor/<short-description>
```

Examples:

```text
feature/us-2-1-appointment-request
feature/us-4-2-change-appointment-status
bugfix/42-invalid-phone-validation
docs/update-technical-design
refactor/auth-module-cleanup
```

---

## Commit Messages

Format:

```text
<story-id>: short description
```

Examples:

```text
US-2.1: create appointment request endpoint
US-2.1: add appointment request validation
US-4.2: implement appointment status update
```

Commits should be:

* small,
* focused,
* easy to review.

Avoid combining unrelated changes in a single commit.

---

# Pull Requests

All changes must be merged through Pull Requests.

Direct commits to the main branch are discouraged.

## Pull Request Requirements

Every Pull Request must reference:

* User Story,
* Acceptance Criteria,
* Related Gherkin specification,
* Tests added or modified.

## Review Requirements

Before merging:

* acceptance criteria are satisfied,
* corresponding Gherkin scenarios exist,
* integration tests pass,
* code follows project standards,
* documentation is updated if required.

## Merge Strategy

Use Squash Merge by default.

Example squash commit:

```text
US-2.1: Implement appointment request submission
```

---

# Coding Standards

## General

* TypeScript strict mode enabled.
* Avoid use of `any`.
* Prefer composition over inheritance.
* Prefer small functions.
* Prefer descriptive names.
* Avoid unnecessary dependencies.

## Backend

* Business logic belongs in services.
* Controllers should remain thin.
* Validation should occur before business logic execution.
* Integration tests should verify observable behavior.

## Frontend

* Components should have a single responsibility.
* Shared UI elements should be reusable.
* API communication should be isolated from presentation logic.
* Frontend validation improves UX but is not a security mechanism.

---

# AI Agent Rules

Before implementing a feature:

1. Read User Story.
2. Read Acceptance Criteria.
3. Read relevant skill.
4. Generate Gherkin specification if missing.
5. Create integration API tests.
6. Implement functionality.

AI agents must not:

* invent requirements,
* introduce features not approved by Product Owner,
* introduce unnecessary frameworks,
* modify unrelated files,
* perform large refactorings without approval.

AI agents should:

* explain major technical decisions,
* propose alternatives when appropriate,
* keep changes small,
* respect project architecture,
* follow project skills.

When uncertain, ask for clarification rather than making assumptions.

---

# Release 1 Constraints

The following are intentionally excluded from Release 1:

* client accounts,
* appointment scheduling,
* reminders,
* notifications,
* reviews,
* AI assistant functionality.

Do not introduce these features unless requirements are updated.

---

# Definition of Done

A task is considered complete when:

* implementation satisfies acceptance criteria,
* corresponding Gherkin scenarios exist,
* integration tests pass,
* code review issues are resolved,
* documentation is updated if necessary,
* no known critical defects remain.
