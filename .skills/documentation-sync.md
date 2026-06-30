# Documentation Sync Skill

Use this skill when code, tests, API behavior, requirements, or architecture may affect project documentation.

## Required Inputs

- `AGENTS.md`
- `docs/Product_Idea.md`
- `docs/uzd_expert_features_and_user_stories_final.md`
- `docs/technical-design.md`
- Related Gherkin specifications and API docs, if present

## Source Of Truth

- Product and requirement changes belong in Product Brief and Features/User Stories.
- Architecture and technology changes belong in Technical Design.
- API additions or changes belong in API documentation.
- Gherkin specifications must match acceptance criteria.

AI agents may propose documentation changes but may not approve new requirements, architecture changes, technology changes, or release scope changes.

## Sync Process

1. Identify what changed: requirement, acceptance criterion, API, architecture, test behavior, or wording only.
2. Check whether the change is already approved by Product Owner or Tech Lead when approval is required.
3. Update the smallest necessary documentation set.
4. Keep wording consistent between GitHub issues, feature documents, Gherkin scenarios, and tests.
5. For validation behavior, keep accepted input classes, rejected input classes, boundary rules, normalization rules, persistence expectations, and API error responses synchronized.
6. Do not add unapproved requirements while improving documentation.
7. Re-check Release 1 exclusions.

## When To Update

- Requirements changed: update Product Brief and Features/User Stories.
- Acceptance criteria changed: update Features/User Stories and related Gherkin.
- Architecture changed: update Technical Design.
- New API introduced: update API documentation.
- API behavior changed: update API documentation and integration tests.
- Gherkin changed: verify it still maps to acceptance criteria.
- Validation rule changed: update Features/User Stories when the rule is a requirement, Gherkin examples, API docs, and integration tests.
- Normalization or persistence behavior changed: update Technical Design or API docs when externally observable, plus Gherkin and tests.

## Review Checklist

- Documentation and implementation describe the same behavior.
- Every acceptance criterion has at least one Gherkin scenario.
- Validation-heavy stories document all accepted, rejected, and boundary input classes in Gherkin.
- Normalization rules in documentation match persisted data and API behavior.
- Error response documentation matches tests.
- API docs use `/api/v1` routes.
- Public and admin behavior are documented separately.
- Release 1 exclusions remain excluded.
- No documentation claims unsupported functionality.
