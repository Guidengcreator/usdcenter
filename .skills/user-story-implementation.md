# User Story Implementation Skill

Use this skill when taking one approved user story from planning through implementation.

## Required Inputs

- `AGENTS.md`
- `docs/uzd_expert_features_and_user_stories_final.md`
- `docs/technical-design.md`
- Relevant skills for Gherkin, backend TDD, API design, and documentation sync

## Core Rule

Implement one user story at a time:

```text
User Story -> Acceptance Criteria -> Test Case Scope Matrix -> Gherkin Scenarios -> Integration API Tests -> Implementation -> Review
```

Do not combine unrelated user stories in one change.
Do not implement until the test case scope matrix and Gherkin scenarios cover all acceptance criteria, equivalence classes, and boundary cases implied by the approved requirements.

## Process

1. Confirm the user story exists in the approved source document or GitHub issues.
2. Read the full story description and acceptance criteria.
3. Identify affected areas: backend, frontend, database, documentation, tests.
4. Read the relevant project skill files.
5. Create or verify a test case scope matrix covering:
   - each acceptance criterion,
   - valid input classes,
   - invalid input classes,
   - boundary cases,
   - omitted, empty, whitespace-only, malformed, unsupported, duplicate, and out-of-range inputs where relevant,
   - normalization or transformation behavior,
   - persistence and no-persistence expectations,
   - backend security-boundary behavior,
   - frontend validation behavior when applicable,
   - API error status and response shape.
6. Create or verify Gherkin scenarios in `tests/specifications/` from the matrix.
7. Create or update integration API tests before backend implementation.
8. Add frontend tests when the frontend performs its own validation, transforms request data, or maps API errors to UI messages.
9. Confirm new or changed tests fail for the expected reason before implementation, unless the behavior already exists and the task is only adding missing coverage.
10. Implement the minimum solution.
11. Run the relevant tests and typechecks.
12. Update documentation if requirements, APIs, or architecture changed.
13. Review the diff for unrelated changes.

## Coverage Gate

Before implementation, explicitly verify:

- Every acceptance criterion maps to at least one Gherkin scenario and one executable test.
- Every row in the test case scope matrix maps to a Gherkin example or scenario.
- Validation rules include positive, negative, and boundary cases.
- Backend tests cover behavior that bypasses frontend validation.
- Frontend tests do not replace backend tests for business validation.
- Persistence tests verify both stored normalized data and no storage for invalid input when relevant.
- Error tests assert status code, error code, message, and meaningful details.

## Project Boundaries

- Do not invent requirements.
- Do not introduce unapproved features.
- Do not add unnecessary frameworks or dependencies.
- Do not perform broad refactors without approval.
- Keep public and admin functionality separated.
- Keep backend business logic out of frontend code.

## Release 1 Exclusions

Do not implement:

- client accounts
- appointment scheduling
- reminders
- notifications
- reviews
- AI assistant functionality

## Completion Checklist

- User story acceptance criteria are satisfied.
- Gherkin scenarios exist and map to the criteria.
- Test case scope matrix is represented by executable tests.
- Integration API tests pass.
- Frontend validation tests pass when frontend validation exists.
- Implementation follows `docs/technical-design.md`.
- Documentation is synchronized where required.
- No unrelated files were changed.
