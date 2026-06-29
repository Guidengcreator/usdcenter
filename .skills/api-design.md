# API Design Skill

Use this skill when designing or changing backend HTTP/JSON APIs.

## Required Inputs

- `AGENTS.md`
- `docs/technical-design.md`
- Target user story and acceptance criteria
- Existing route and test patterns

## API Principles

- Use REST-style resource URLs.
- Use JSON request and response bodies.
- Use predictable HTTP status codes.
- Use `/api/v1` for every endpoint.
- Keep public and admin endpoints clearly separated.
- Validate all input on the backend.
- Return consistent error responses.
- Do not expose sensitive data through public APIs.

## Validation Contract

For every request body, query parameter, or path parameter with validation rules, define:

- required versus optional fields,
- accepted input classes,
- rejected input classes,
- boundary values,
- allowed formats, enums, separators, ranges, and lengths,
- normalization or transformation before persistence or response,
- behavior for omitted, empty, whitespace-only, wrong-type, malformed, unsupported, duplicate, and extra-field inputs where relevant,
- status code and error response details for invalid input.

If the accepted or rejected cases are unclear from approved requirements, ask for clarification before implementing the API.

## Approved Endpoint Patterns

Public examples:

```text
GET  /api/v1/clinic-information
GET  /api/v1/privacy-policy
POST /api/v1/appointment-requests
```

Admin examples:

```text
POST  /api/v1/admin/auth/login
POST  /api/v1/admin/auth/logout
GET   /api/v1/admin/appointment-requests
PATCH /api/v1/admin/appointment-requests/:id/status
GET   /api/v1/admin/clinic-information
PUT   /api/v1/admin/clinic-information
```

## Error Shape

Use a consistent error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": []
  }
}
```

## Design Process

1. Start from the user story and acceptance criteria.
2. Identify the resource and whether it is public or admin.
3. Choose the HTTP method and `/api/v1` route.
4. Define request body, query parameters, path parameters, and response body.
5. Define the validation contract, including accepted, rejected, boundary, and normalized cases.
6. Define error responses with status code, error code, message, and details.
7. Define authentication and authorization behavior.
8. Translate the API behavior into Gherkin and integration API tests.
9. Update API documentation when the endpoint is introduced or changed.

## Completion Checklist

- Endpoint is required by an approved story.
- Public/admin boundary is clear.
- Authentication behavior is explicit.
- Validation rules are testable.
- Accepted, rejected, boundary, and normalization cases are documented.
- Invalid input error response shape is documented.
- Integration API tests cover success and failure paths.
- API documentation is synchronized.
