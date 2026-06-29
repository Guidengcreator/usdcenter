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
User Story -> Acceptance Criteria -> Test Case Scope Matrix -> Gherkin Scenarios -> Integration API Tests -> Implementation
```

Do not design scenarios for requirements that are not present in the approved user story.

Before writing or changing implementation, create or update a complete test case scope matrix for the story. "Complete" means all meaningful equivalence classes and boundaries from the approved acceptance criteria are represented. It does not mean infinite input enumeration.

## Process

1. Identify the feature number, user story ID, description, and all acceptance criteria.
2. Extract every explicit business rule from the acceptance criteria and approved supporting documents.
3. Build a test case scope matrix before writing scenarios. Include:
   - acceptance criterion,
   - business rule,
   - valid input classes,
   - invalid input classes,
   - boundary values,
   - omitted, empty, whitespace-only, malformed, duplicate, unsupported, and out-of-range inputs where relevant,
   - normalization or transformation rules,
   - persistence or no-persistence expectations,
   - API status and error response expectations,
   - frontend validation expectations when the frontend has its own validation,
   - backend validation expectations that bypass frontend validation,
   - related Gherkin scenario name.
4. Use Scenario Outlines with Examples tables for input classes and boundary cases.
5. Map every acceptance criterion and every row of the test case scope matrix to at least one scenario.
6. Prefer observable behavior over implementation details.
7. Separate public and admin behavior clearly.
8. Include authentication and authorization scenarios for admin functionality.
9. Include validation and error scenarios when the acceptance criteria mention invalid input.
10. Include persistence checks when the acceptance criteria mention stored data.
11. Keep scenarios small enough to become direct API integration tests.

## Test Case Scope Matrix Rules

- Treat validation stories as incomplete until both accepted and rejected input classes are documented.
- Include boundary values for every constrained format, length, range, enum, date, state, or numeric field.
- Include missing-field, empty-string, whitespace-only, wrong-type, unsupported-character, and extra-field cases when the API accepts structured input.
- Include normalization examples when data is transformed before storage or response.
- Include security-boundary examples showing backend validation works without frontend validation.
- Include response-shape examples for invalid requests, including status code, error code, message, and details.
- If the approved requirements do not specify a rule needed to classify an input, stop and ask for clarification instead of inventing behavior.
- Do not collapse distinct risks into one vague scenario. Use a Scenario Outline when multiple examples share the same expected behavior.

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
- Every business rule has a test case scope matrix entry.
- Valid, invalid, and boundary input classes are covered where the story includes validation.
- Normalization and persistence expectations are covered when data is transformed or stored.
- Backend validation is covered independently of frontend validation.
- Error status and response body shape are covered for invalid input.
- Public endpoints remain unauthenticated.
- Admin endpoints require authentication where applicable.
- Release 1 exclusions are not introduced.
- The specification can be translated into integration API tests.
