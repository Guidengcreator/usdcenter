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
User Story -> Acceptance Criteria -> Gherkin Scenarios -> Integration API Tests -> Implementation -> Review
```

Do not combine unrelated user stories in one change.

## Process

1. Confirm the user story exists in the approved source document or GitHub issues.
2. Read the full story description and acceptance criteria.
3. Identify affected areas: backend, frontend, database, documentation, tests.
4. Read the relevant project skill files.
5. Create or verify Gherkin scenarios in `tests/specifications/`.
6. Create or update integration API tests before backend implementation.
7. Confirm the tests fail for the expected reason.
8. Implement the minimum solution.
9. Run the relevant tests.
10. Update documentation if requirements, APIs, or architecture changed.
11. Review the diff for unrelated changes.

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
- Integration API tests pass.
- Implementation follows `docs/technical-design.md`.
- Documentation is synchronized where required.
- No unrelated files were changed.
