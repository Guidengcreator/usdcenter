# Backend TDD Skill

Use this skill when implementing backend behavior for an approved user story.

## Required Inputs

- `AGENTS.md`
- `docs/technical-design.md`
- `docs/uzd_expert_features_and_user_stories_final.md`
- Relevant Gherkin specification from `tests/specifications/`

## Core Rule

Backend work must follow:

```text
User Story -> Acceptance Criteria -> Gherkin Scenarios -> Integration API Tests -> Implementation
```

Do not implement backend behavior until the Gherkin specification and failing integration tests exist.

## Project Constraints

- Backend is Fastify with TypeScript.
- PostgreSQL is accessed only through Drizzle ORM.
- Business logic belongs in services.
- Controllers should remain thin.
- Validation runs before business logic.
- Backend validation is the security boundary.
- Public and admin endpoints must stay clearly separated.
- All APIs use the `/api/v1` prefix.
- Integration API tests are preferred over isolated unit tests for business behavior.

## TDD Process

1. Read the target user story and acceptance criteria.
2. Read the related Gherkin scenarios.
3. Create or update integration API tests from those scenarios.
4. Run the test and confirm it fails for the expected reason.
5. Implement the smallest backend change needed.
6. Run the test and confirm it passes.
7. Add edge-case tests for validation, authorization, and persistence risks.
8. Refactor only when it improves clarity without changing behavior.

## Test Expectations

- Use Vitest.
- Use Fastify Inject for API tests.
- Use an isolated PostgreSQL test database.
- Verify HTTP status codes, response bodies, validation errors, and persisted state.
- Avoid testing implementation details that are not observable through the API.

## Security Checks

- Admin endpoints reject unauthenticated requests with HTTP 401 or 403.
- Public endpoints remain accessible without login.
- Passwords are never stored or logged in plain text.
- Error responses do not expose internal details.
- Suspicious or rate-limited requests are logged when required by the story.

## Completion Checklist

- Integration tests fail before implementation and pass after implementation.
- All acceptance criteria are covered.
- Drizzle is used for database access.
- No Release 1 exclusions are added.
- Documentation is updated if API or architecture changed.
