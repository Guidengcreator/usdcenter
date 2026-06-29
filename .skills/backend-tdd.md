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
User Story -> Acceptance Criteria -> Test Case Scope Matrix -> Gherkin Scenarios -> Integration API Tests -> Implementation
```

Do not implement backend behavior until the Gherkin specification and failing integration tests exist.
Do not implement backend validation from only one or two sample inputs. First enumerate the accepted, rejected, and boundary input classes required by the story.

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
3. Verify the Gherkin scenarios came from a test case scope matrix. If not, create or update the matrix and scenarios first.
4. Create or update integration API tests from every matrix row and Gherkin example that describes backend-observable behavior.
5. Run the test and confirm it fails for the expected reason.
6. Implement the smallest backend change needed.
7. Run the test and confirm it passes.
8. Add edge-case tests for validation, authorization, and persistence risks if the matrix exposed any missing cases.
9. Refactor only when it improves clarity without changing behavior.

## Backend Validation Test Matrix

For every backend endpoint that validates input, include tests for relevant cases:

- required field omitted,
- required field empty,
- required field whitespace-only,
- wrong JSON type when route schema should reject it,
- unsupported extra field when the API contract forbids it,
- valid boundary values,
- invalid boundary values just outside the allowed range or format,
- malformed values that are superficially similar to valid values,
- unsupported characters or separators,
- duplicate or conflicting values when relevant,
- normalization before persistence or response,
- no persistence for invalid requests,
- structured error response for invalid requests.

Backend tests must assert observable behavior:

- HTTP status code,
- response body success or error shape,
- validation error details when meaningful,
- database state after success,
- database state after rejection.

## Test Expectations

- Use Vitest.
- Use Fastify Inject for API tests.
- Use an isolated PostgreSQL test database.
- Verify HTTP status codes, response bodies, validation errors, and persisted state.
- Avoid testing implementation details that are not observable through the API.
- Prefer `it.each` or Scenario Outline-equivalent tables for validation input classes.
- Keep reusable test helpers local and explicit when they make the matrix easier to audit.

## Security Checks

- Admin endpoints reject unauthenticated requests with HTTP 401 or 403.
- Public endpoints remain accessible without login.
- Passwords are never stored or logged in plain text.
- Error responses do not expose internal details.
- Suspicious or rate-limited requests are logged when required by the story.

## Completion Checklist

- Integration tests fail before implementation and pass after implementation.
- All acceptance criteria are covered.
- All backend-observable matrix rows have integration API tests.
- Validation tests cover accepted, rejected, and boundary input classes.
- Invalid requests verify no unintended database writes.
- Normalized values are asserted after persistence when normalization exists.
- Drizzle is used for database access.
- No Release 1 exclusions are added.
- Documentation is updated if API or architecture changed.
