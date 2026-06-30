# Pull Request Review Skill

Use this skill when reviewing a PR or local diff.

## Required Inputs

- `AGENTS.md`
- `docs/uzd_expert_features_and_user_stories_final.md`
- `docs/technical-design.md`
- Related Gherkin specification
- Test results, if available

## Review Stance

Prioritize defects over summaries. Focus on bugs, security risks, requirement gaps, regressions, and missing tests.

## Required PR Checks

- PR references the User Story.
- PR references Acceptance Criteria.
- PR references the related Gherkin specification.
- PR includes or updates the test case scope matrix for validation-heavy stories.
- Tests added or modified are listed.
- Integration API tests pass.
- Documentation is updated when requirements, APIs, or architecture changed.

## Review Process

1. Identify the intended user story and scope.
2. Compare the diff against the acceptance criteria.
3. Verify every criterion has Gherkin and test coverage.
4. Verify validation-heavy stories include a complete test case scope matrix.
5. Check that every matrix row maps to a Gherkin scenario or example and an executable test.
6. Check backend API behavior through tests where possible.
7. Check authentication and authorization for admin endpoints.
8. Check validation, persistence, and error responses.
9. Check that public endpoints remain public and admin endpoints remain protected.
10. Check for unrelated refactors or unapproved features.
11. Check documentation synchronization.

## Test Coverage Review

For validation and business-rule stories, treat missing equivalence classes as review findings. Check for:

- accepted input classes,
- rejected input classes,
- boundary values,
- omitted required fields,
- empty and whitespace-only fields,
- wrong types and unsupported extra fields when relevant,
- malformed inputs that are close to valid inputs,
- normalization or transformation behavior,
- persistence after success,
- no persistence after rejection,
- backend validation independent of frontend validation,
- frontend validation tests when frontend validation exists,
- structured API error status, code, message, and details.

## Common Risks

- Implementation begins without Gherkin or integration tests.
- Scenarios cover only one happy path and one invalid example while missing input classes and boundaries.
- Frontend and backend validation rules drift apart.
- Frontend validation is treated as a security mechanism.
- Admin data is exposed through public endpoints.
- Database access bypasses Drizzle ORM.
- API endpoints omit `/api/v1`.
- Error responses expose internals.
- Release 1 exclusions are accidentally introduced.

## Output Format

Use this order:

1. Findings, ordered by severity with file and line references.
2. Open questions or assumptions.
3. Brief change summary.
4. Tests reviewed or missing.

If there are no findings, say so directly and identify any residual risk.
