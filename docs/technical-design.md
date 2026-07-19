# Technical Design — УЗД Эксперт

## 1. Overview

`УЗД Эксперт` is a web application for a small ultrasound diagnostic center.

The system provides:

- a public website for clinic information,
- a public appointment request form,
- an admin panel for managing appointment requests,
- basic clinic information management,
- secure access to administrative functionality.

The application is designed as a real production-oriented system, while keeping the architecture simple, explicit, and maintainable.

---

## 2. Architecture Overview

### Architectural Style

The application follows a classic three-tier web architecture consisting of:

- React frontend,
- Fastify backend API,
- PostgreSQL database.

The frontend communicates with the backend using HTTP/JSON APIs.

The backend contains all business logic, validation, authentication, and data access logic.

The database is responsible for persistent storage.

### High-Level Architecture

```text
Browser
   ↓
React Frontend
   ↓ HTTP/JSON
Fastify REST API
   ↓
PostgreSQL
```

### Architectural Principles

- Separation of concerns.
- Backend owns business logic.
- Database access is performed through Drizzle ORM.
- Frontend never accesses the database directly.
- All external communication occurs through documented API endpoints.
- Security checks are performed on the backend.
- Integration tests verify API behavior.
- Features are implemented incrementally using TDD.

### Deployment Architecture

Frontend:

- React static assets served from the production reverse proxy on the first affordable production deployment.
- AWS Amplify Hosting remains a later managed hosting option.

Backend:

- Fastify backend running in a Docker container on Amazon Lightsail for the first affordable production deployment.
- Managed backend hosting remains a later migration option.

Database:

- PostgreSQL running in a private Docker Compose service on Amazon Lightsail for the first affordable production deployment.
- Amazon RDS PostgreSQL remains a later managed database option.

### Future Evolution

The architecture is designed to allow future additions such as:

- appointment scheduling,
- client accounts,
- appointment history,
- notifications,
- reviews,
- AI-assisted features.

---

## 3. Technology Stack

## Frontend

### React

React is used as the frontend framework for building the user interface.

Reasons:

- Mature ecosystem.
- Large community support.
- Excellent TypeScript integration.
- Well-suited for component-based development.

### TypeScript

TypeScript is used throughout the frontend codebase.

Reasons:

- Static typing.
- Better developer experience.
- Improved maintainability.
- Safer refactoring.

### Vite

Vite is used as the frontend build tool.

Reasons:

- Fast startup time.
- Fast hot module replacement.
- Simple configuration.
- Excellent React support.

---

## Backend

### Node.js

Node.js is used as the backend runtime environment.

Reasons:

- Large ecosystem.
- Excellent TypeScript support.
- Good fit for REST APIs.
- Unified language across frontend and backend.

### Fastify

Fastify is used as the backend web framework.

Reasons:

- High performance.
- Strong TypeScript support.
- Built-in schema validation support.
- Simple plugin architecture.

### Admin Authentication

Admin authentication uses backend-owned, server-side sessions.

- Admin users are stored in PostgreSQL with normalized email addresses and
  password hashes.
- Plain passwords are never stored or returned by API responses.
- Successful login creates an `admin_sessions` row with an opaque random session
  id and expiration timestamp.
- The browser receives the session id only in an HTTP-only cookie scoped to
  `/api/v1/admin`.
- Admin endpoints validate the session against PostgreSQL and reject missing,
  invalid, revoked, or expired sessions.
- Public endpoints remain accessible without authentication.

---

## Database

### PostgreSQL

PostgreSQL is the primary relational database.

Reasons:

- Reliable and mature.
- Strong data integrity guarantees.
- Excellent support for relational data.
- Widely supported by cloud providers.

### Drizzle ORM

Drizzle ORM is used for database access.

Reasons:

- Type-safe queries.
- Lightweight architecture.
- SQL-oriented development style.
- Excellent TypeScript integration.

---

## Testing

### Testing Philosophy

Backend development follows a Test-Driven Development approach.

Features are implemented by:

1. Writing an integration test.
2. Running the test and observing failure.
3. Implementing the minimum code required.
4. Making the test pass.
5. Refactoring if necessary.

### Vitest

Vitest is used as the test runner.

### Integration API Tests

Integration tests verify API behavior through HTTP requests.

Integration tests are preferred over isolated unit tests for business functionality.

### Fastify Inject

Fastify Inject is used for API integration testing without opening network ports.

### Test Database

Tests use an isolated PostgreSQL database instance.

The preferred local setup is a dedicated Docker container.

---

## Infrastructure

### AWS

AWS is the selected cloud provider.

### Amazon Lightsail

Amazon Lightsail is used for the first affordable production deployment.

The Lightsail deployment runs the application on a single VPS through Docker
Compose:

- frontend static assets served by a reverse proxy,
- Fastify backend container,
- PostgreSQL container,
- automated PostgreSQL dumps,
- Lightsail instance snapshots.

This keeps Release 1 infrastructure affordable and simple while preserving the
same three-tier application boundaries.

### AWS Amplify Hosting

Used for a later managed frontend deployment when the project outgrows the
single-server deployment.

### Managed Backend Hosting

Used for a later managed backend deployment when higher availability or reduced
server maintenance becomes more important than the lowest monthly cost.

### Amazon RDS PostgreSQL

Used for a later managed PostgreSQL deployment when automated managed database
operations become more important than the lowest monthly cost.

---

## Local Development Environment

### Docker

Docker is used to provide a consistent development environment.

### Local PostgreSQL

Developers run PostgreSQL locally through Docker.

### Environment Configuration

Application configuration is managed through environment variables.

Secrets must never be stored in source code repositories.

For local development, non-secret default configuration is committed in
environment-specific development files:

- `backend/.env.development`
- `frontend/.env.development`

Backend development scripts load `backend/.env.development` before running the
local server, Drizzle, migration, and seed commands. Vite loads
`frontend/.env.development` for frontend development commands. Production
configuration remains environment-based and must be provided by the deployment
platform or secret-management mechanism.

---

## 4. Domain Model

The domain model describes the main business concepts used by the system.

For the first release, the domain model should remain small and focused. It should support the current MVP while avoiding architectural decisions that would block future expansion.

### Main Domain Entities

- Client
- AppointmentRequest
- AdminUser
- ClinicInformation
- PrivacyPolicy

---

## 4.1 Client

The Client represents a real or potential customer of the ultrasound diagnostic center.

In the first release, clients do not have accounts and do not authenticate in the system. A client can submit an appointment request by providing contact information.

For Release 1, client information is stored as part of the appointment request rather than as a separate authenticated user account.

### Future Role

In future releases, the Client domain may be expanded to support:

- client accounts,
- client profiles,
- appointment history,
- appointment reminders,
- personal cabinet,
- reviews after visits.

### Release 1 Decision

No separate `clients` table is required in the first release unless implementation needs change.

The system should still use clear naming that allows future migration from appointment contact fields to a separate Client entity.

---

## 4.2 AppointmentRequest

The AppointmentRequest represents a request submitted by a public website visitor.

It is not a confirmed appointment. It is a request for the clinic administration to contact the user.

### Main Fields

- `id`
- `fullName`
- `phone`
- `email`
- `serviceType`
- `comment`
- `status`
- `createdAt`
- `updatedAt`

### Required Fields

- `fullName`
- `phone`

### Optional Fields

- `email`
- `serviceType`
- `comment`

### Status Values

Allowed statuses:

- `new`
- `contacted`
- `confirmed`
- `cancelled`
- `completed`

### Initial Status

Every newly submitted appointment request receives status:

```text
new
```

### Business Rules

- Appointment requests can be created without authentication.
- Appointment requests can only be viewed by authenticated administrators.
- Appointment request status can only be changed by authenticated administrators.
- Preferred date and preferred time are not included in Release 1.
- Scheduling is handled manually by the clinic outside the system in Release 1.

---

## 4.3 AdminUser

The AdminUser represents a clinic administrator who can access the admin panel.

### Main Fields

- `id`
- `email`
- `passwordHash`
- `displayName`
- `createdAt`
- `updatedAt`

### Business Rules

- Admin users must authenticate before accessing admin functionality.
- Passwords must never be stored in plain text.
- Only authenticated administrators can view appointment requests.
- Only authenticated administrators can update appointment request statuses.
- Only authenticated administrators can update clinic information.

---

## 4.4 ClinicInformation

ClinicInformation represents public information displayed on the website.

### Main Fields

- `id`
- `clinicName`
- `description`
- `address`
- `phone`
- `email`
- `workingHours`
- `updatedAt`

### Business Rules

- Clinic information is publicly visible.
- Clinic information can only be modified by authenticated administrators.
- Public pages should retrieve clinic information from the backend API or configuration source.

---

## 4.5 PrivacyPolicy

PrivacyPolicy represents the public privacy policy page.

### Main Fields

- `id`
- `content`
- `updatedAt`

### Business Rules

- The privacy policy is publicly visible.
- The appointment request form must reference the privacy policy.
- Users must confirm consent before submitting an appointment request.
- The privacy policy can be stored as static content or database-managed content in the first release.

---

## 5. Backend Architecture

The backend is implemented as a Fastify application.

The backend is responsible for:

- API routing,
- request validation,
- business logic,
- authentication,
- authorization,
- data access,
- structured logging,
- error handling.

### Recommended Backend Structure

```text
backend/
  src/
    app.ts
    server.ts
    config/
    db/
    modules/
      appointments/
      auth/
      clinic/
      privacy/
    plugins/
    shared/
    tests/
```

### Module Responsibilities

#### appointments

Responsible for:

- creating appointment requests,
- validating appointment request data,
- listing appointment requests for administrators,
- searching appointment requests,
- sorting appointment requests,
- changing appointment request status.

#### auth

Responsible for:

- admin login,
- admin logout,
- password verification,
- token/session handling,
- admin route protection.

#### clinic

Responsible for:

- reading public clinic information,
- updating clinic information by administrators.

#### privacy

Responsible for:

- reading privacy policy content,
- providing privacy policy reference for public pages.

---

## 6. Frontend Architecture

The frontend is implemented as a React application built with Vite.

The frontend is responsible for:

- public website pages,
- appointment request form,
- admin login page,
- admin appointment management interface,
- clinic information management UI.

### Recommended Frontend Structure

```text
frontend/
  src/
    app/
    pages/
      public/
      admin/
    components/
    features/
      appointments/
      auth/
      clinic/
      privacy/
    api/
    shared/
    styles/
```

### Public Pages

Public pages include:

- home page,
- clinic information section,
- address and contact section,
- working hours section,
- appointment request form,
- privacy policy page.

### Admin Pages

Admin pages include:

- login page,
- appointment request list,
- appointment search and sorting controls,
- appointment status management,
- clinic information editing page.

### Frontend Rules

- The frontend does not access the database directly.
- All persistent data is loaded through backend API endpoints.
- Sensitive admin functionality is only available after authentication.
- Form validation should exist on the frontend for user experience.
- Backend validation remains the source of truth.

---

## 7. Database Design

The database is PostgreSQL.

Database access is performed through Drizzle ORM.

The initial database should contain only the tables required for Release 1.

### Initial Tables

Recommended initial tables:

- `appointment_requests`
- `admin_users`
- `clinic_information`
- `privacy_policies`

### appointment_requests

Stores appointment requests submitted through the public form.

Suggested fields:

- `id`
- `full_name`
- `phone`
- `email`
- `service_type`
- `comment`
- `status`
- `created_at`
- `updated_at`

### admin_users

Stores administrator accounts.

Suggested fields:

- `id`
- `email`
- `password_hash`
- `display_name`
- `created_at`
- `updated_at`

### clinic_information

Stores public clinic information.

Suggested fields:

- `id`
- `clinic_name`
- `description`
- `address`
- `phone`
- `email`
- `working_hours`
- `updated_at`

### privacy_policies

Stores privacy policy content if managed through the database.

Suggested fields:

- `id`
- `content`
- `updated_at`

### Future Tables

Possible future tables:

- `clients`
- `appointments`
- `reviews`
- `notifications`
- `services`

These are not required in Release 1.

---

## 8. API Design Principles

The backend exposes REST-style HTTP/JSON endpoints.

### General Principles

- Use JSON request and response bodies.
- Use clear resource-oriented URLs.
- Use predictable HTTP status codes.
- Validate all input on the backend.
- Keep public and admin endpoints clearly separated.
- Use API versioning from the beginning.

### API Versioning

All API endpoints should use the `/api/v1` prefix.

Example:

```text
POST /api/v1/appointment-requests
```

### Public API Examples

```text
GET  /api/v1/clinic-information
GET  /api/v1/privacy-policy
POST /api/v1/appointment-requests
```

### Admin API Examples

```text
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout

GET   /api/v1/admin/appointment-requests
PATCH /api/v1/admin/appointment-requests/:id/status

GET /api/v1/admin/clinic-information
PUT /api/v1/admin/clinic-information
```

### Error Response Shape

The API should return consistent error responses.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": []
  }
}
```

---

## 9. Authentication and Authorization Design

Only administrators authenticate in Release 1.

Public users do not have accounts.

### Admin Authentication

Admin authentication is required for:

- viewing appointment requests,
- searching and sorting appointment requests,
- changing appointment request status,
- updating clinic information.

### Password Storage

Passwords must be stored as secure hashes.

Plain text passwords are forbidden.

### Session or Token Strategy

The exact implementation can be decided during backend implementation.

Acceptable options:

- HTTP-only secure cookies,
- short-lived access tokens.

For production use, secure cookies are preferred for browser-based admin panels.

### Authorization Rules

- Public endpoints are accessible without authentication.
- Admin endpoints require valid administrator authentication.
- Authorization is enforced on the backend.
- Frontend route protection is only a user experience layer, not a security boundary.

---

## 10. Appointment Request Workflow

### Public User Flow

```text
1. User opens public website.
2. User opens appointment request form.
3. User enters contact information.
4. User confirms privacy consent.
5. User submits the form.
6. Backend validates the request.
7. Backend stores the request with status `new`.
8. User receives confirmation message.
```

### Admin Flow

```text
1. Admin logs in.
2. Admin opens appointment request list.
3. Admin searches or sorts requests if needed.
4. Admin contacts the client outside the system.
5. Admin changes request status.
6. Updated status is saved in the database.
```

---

## 11. Testing Strategy

Backend API features should be developed using Test-Driven Development.

### Backend Integration Test Flow

For each backend feature:

1. Write an integration test.
2. Run the test and confirm it fails.
3. Implement the minimum backend logic.
4. Run the test and confirm it passes.
5. Refactor if needed.
6. Add edge-case tests.

### Test Coverage Priorities

High-priority backend tests:

- create valid appointment request,
- reject invalid appointment request,
- reject appointment request without required fields,
- apply rate limiting to appointment request endpoint,
- admin login succeeds with valid credentials,
- admin login fails with invalid credentials,
- unauthenticated users cannot access admin appointment list,
- authenticated admin can view appointment requests,
- authenticated admin can search appointment requests,
- authenticated admin can sort appointment requests,
- authenticated admin can change appointment status,
- public users can read clinic information,
- authenticated admin can update clinic information.

### Frontend Testing

Frontend testing can be added after core UI implementation.

Initial frontend verification may rely on manual testing.

Future frontend tests may include:

- component tests,
- form validation tests,
- end-to-end tests.

---

## 12. Security Considerations

The application handles contact information from real users. Basic security and privacy requirements are mandatory.

### Required Security Measures

- HTTPS in production.
- Secure password hashing.
- Server-side validation.
- Rate limiting for public form submission.
- Authentication for admin endpoints.
- Environment-based configuration.
- Secrets must not be committed to the repository.
- Sensitive data must not be exposed through public APIs.
- Error responses must not expose internal implementation details.

### Privacy Considerations

- Appointment form should collect only necessary information.
- Medical history should not be requested in Release 1.
- Privacy policy must be publicly accessible.
- User must confirm consent before submitting an appointment request.

---

## 13. Logging and Monitoring

The backend should use structured logging.

### Logging Requirements

- Log application startup.
- Log API errors.
- Log suspicious or rate-limited requests.
- Log authentication failures.
- Avoid logging sensitive data such as passwords.

### Future Monitoring

Future production monitoring may include:

- AWS CloudWatch logs,
- error tracking,
- uptime monitoring,
- basic performance metrics.

---

## 14. Deployment Architecture

Production deployment uses AWS.

The first production deployment prioritizes affordability and operational
simplicity by using Amazon Lightsail with Docker Compose. Managed AWS services
remain the preferred future migration path when the project requires higher
availability or reduced server maintenance.

### Frontend

The frontend is built with Vite and served as static files by the production
reverse proxy container.

### Backend

The backend is built as a Docker image and runs as a Fastify service inside the
production Docker Compose deployment.

### Database

The first production database runs as a PostgreSQL Docker Compose service with a
persistent Docker volume. The database port is not exposed publicly.

Production backups include:

- scheduled PostgreSQL dumps,
- retention for old dump files,
- Lightsail instance snapshots,
- periodic restore verification.

### Environment Variables

Production configuration is provided through environment variables.

Examples:

- `DATABASE_URL`
- `NODE_ENV`
- `JWT_SECRET` or session secret
- `CORS_ORIGIN`
- `PORT`

### Deployment Rule

Deployment configuration should be documented separately when implementation reaches deployment stage.

---

## 15. Future Extensions

The system should be designed to allow future growth without implementing unnecessary features in Release 1.

Possible future extensions:

- client accounts,
- client profiles,
- appointment scheduling,
- appointment calendar,
- appointment reminders,
- email/SMS notifications,
- reviews and ratings,
- analytics and statistics,
- AI assistant,
- multi-admin roles,
- service catalog,
- doctor/operator schedules.

These features are intentionally excluded from Release 1.
