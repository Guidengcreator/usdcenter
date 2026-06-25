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

`fullName` and `phone` are required. `email`, `serviceType`, and `comment` are optional.

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
      "body/fullName must NOT have fewer than 1 characters"
    ]
  }
}
```
