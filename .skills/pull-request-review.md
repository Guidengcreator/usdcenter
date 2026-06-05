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
- Tests added or modified are listed.
- Integration API tests pass.
- Documentation is updated when requirements, APIs, or architecture changed.

## Review Process

1. Identify the intended user story and scope.
2. Compare the diff against the acceptance criteria.
3. Verify every criterion has Gherkin and test coverage.
4. Check backend API behavior through tests where possible.
5. Check authentication and authorization for admin endpoints.
6. Check validation, persistence, and error responses.
7. Check that public endpoints remain public and admin endpoints remain protected.
8. Check for unrelated refactors or unapproved features.
9. Check documentation synchronization.

## Common Risks

- Implementation begins without Gherkin or integration tests.
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
