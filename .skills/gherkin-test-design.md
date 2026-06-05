# Gherkin Test Design Skill

Use this skill when turning an approved user story into Gherkin scenarios.

## Required Inputs

- `AGENTS.md`
- `docs/uzd_expert_features_and_user_stories_final.md`
- `docs/technical-design.md`
- The target User Story and Acceptance Criteria

## Core Rule

Follow this order:

```text
User Story -> Acceptance Criteria -> Gherkin Scenarios -> Integration API Tests -> Implementation
```

Do not design scenarios for requirements that are not present in the approved user story.

## Process

1. Identify the feature number, user story ID, description, and all acceptance criteria.
2. Map every acceptance criterion to at least one scenario.
3. Prefer observable behavior over implementation details.
4. Separate public and admin behavior clearly.
5. Include authentication and authorization scenarios for admin functionality.
6. Include validation and error scenarios when the acceptance criteria mention invalid input.
7. Include persistence checks when the acceptance criteria mention stored data.
8. Keep scenarios small enough to become direct API integration tests.

## File Location

Store specifications under:

```text
tests/specifications/
```

Preferred structure:

```text
tests/specifications/appointments/
tests/specifications/admin/
tests/specifications/clinic/
```

Example:

```text
tests/specifications/appointments/us-2.1-submit-appointment-request.feature
```

## Scenario Standards

- Use clear `Feature`, `Background`, `Scenario`, `Given`, `When`, `Then`, and `And`.
- Name scenarios after user-visible behavior.
- Use concrete API-visible examples where useful.
- Avoid UI-only language for backend API tests.
- Do not reference database tables unless persistence is the behavior being verified.

## Completion Checklist

- Every acceptance criterion is covered.
- Public endpoints remain unauthenticated.
- Admin endpoints require authentication where applicable.
- Release 1 exclusions are not introduced.
- The specification can be translated into integration API tests.
