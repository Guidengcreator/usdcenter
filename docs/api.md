# API Documentation

All endpoints use the `/api/v1` prefix and JSON response bodies.

## Public Clinic Information

### `GET /api/v1/clinic-information`

Returns the public clinic information used by the clinic information section. Authentication is not required.

The `email` field may be `null` when the clinic does not publish an email address.

#### Successful response

Status: `200 OK`

```json
{
  "data": {
    "clinicName": "Example clinic",
    "description": "Example clinic description",
    "address": "Example clinic address",
    "phone": "+380 44 123 45 67",
    "email": "info@example.com",
    "workingHours": "Mon-Fri: 09:00-18:00"
  }
}
```

#### Clinic information is not configured

Status: `404 Not Found`

```json
{
  "error": {
    "code": "CLINIC_INFORMATION_NOT_FOUND",
    "message": "Clinic information is not configured",
    "details": []
  }
}
```

## Public Appointment Requests

### `POST /api/v1/appointment-requests`

Submits a public appointment request without authentication.

This endpoint is rate limited on the backend. No more than 5 appointment
submission attempts are allowed per resolved source IP during a 15-minute
window. The limit applies before request validation, so malformed appointment
submission attempts also count. Rejected requests are not stored in PostgreSQL.

The backend uses Fastify's resolved client IP address for the limit key. In
deployments behind a trusted proxy, configure the backend with
`TRUST_PROXY_HOPS` so Fastify can resolve the client IP through the trusted
proxy chain. Do not set unrestricted proxy trust for this API.

#### Request body

```json
{
  "fullName": "Example Patient",
  "phone": "+380 44 123 45 67",
  "email": "patient@example.com",
  "serviceType": "Abdominal ultrasound",
  "comment": "Please call after 14:00"
}
```

#### Rate limit exceeded

Status: `429 Too Many Requests`

Headers:

- `Retry-After`: positive integer number of seconds until the source IP can
  retry, not greater than `900`.

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many appointment request attempts. Please try again later.",
    "details": []
  }
}
```

Each rejected appointment submission emits a structured warning log event
through the backend Fastify logger:

```json
{
  "event": "appointment_request_rate_limited",
  "requestId": "req-6",
  "method": "POST",
  "route": "/api/v1/appointment-requests",
  "sourceIp": "203.0.113.10",
  "retryAfterSeconds": 900,
  "configuredMax": 5,
  "configuredTimeWindowSeconds": 900
}
```

The rate-limit log is emitted to the configured backend logger stream. In local
development, run the backend with `npm run dev --workspace backend` and view the
logs in that terminal. The implementation does not write these logs to
PostgreSQL or a local file.

Rate-limit state is process-local and in memory. It resets when the backend
process restarts and is not shared between multiple backend instances.

`fullName` and `phone` are required. `phone` must contain 10 to 15 digits and may include a leading `+`, spaces, parentheses, or hyphens. `email`, `serviceType`, and `comment` are optional.

#### Successful response

Status: `201 Created`

```json
{
  "data": {
    "message": "Appointment request submitted successfully"
  }
}
```

#### Validation error

Status: `400 Bad Request`

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      "body/phone must be a valid phone number"
    ]
  }
}
```
