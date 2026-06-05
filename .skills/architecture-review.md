# Architecture Review Skill

Use this skill when reviewing a proposed or implemented technical change for architectural fit.

## Required Inputs

- `AGENTS.md`
- `docs/technical-design.md`
- Target user story or proposed change
- Relevant code or design diff

## Review Priorities

1. Correctness against approved requirements.
2. Simplicity and maintainability.
3. Separation of public and admin behavior.
4. Backend ownership of business logic.
5. Security validation on the backend.
6. API consistency and versioning.
7. Documentation synchronization.

## Architecture Rules

- Keep the architecture simple.
- Prefer explicit code over abstraction.
- Avoid premature optimization.
- Favor readability over cleverness.
- Use React for frontend, Fastify for backend, PostgreSQL for persistence, and Drizzle ORM for database access.
- Frontend communicates with the backend through HTTP/JSON only.
- All external API endpoints use `/api/v1`.
- Admin functionality requires backend authentication and authorization.

## Review Questions

- Is the change required by an approved user story?
- Does it introduce Release 1 exclusions?
- Does it keep controllers thin and business logic in services?
- Does it avoid direct frontend database access?
- Does it avoid leaking sensitive data through public APIs or logs?
- Does it use consistent error response shape?
- Are tests focused on observable API behavior?
- Does a documentation update belong with this change?

## Output Format

Lead with findings ordered by severity:

- Critical: production, security, data-loss, or major requirement risk.
- High: behavior mismatch, missing authorization, missing persistence, or broken API contract.
- Medium: maintainability, unclear responsibility, or missing test coverage.
- Low: naming, clarity, or small consistency issues.

If no issues are found, state that clearly and mention remaining risk or test gaps.
