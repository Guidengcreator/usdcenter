# Features and User Stories — УЗД Эксперт

# Feature 1 — Public Clinic Information

## User Story 1.1 — View Clinic Information

### Description

As a user, I want to view information about the ultrasound diagnostic center so that I can understand what services the clinic provides.

### Acceptance Criteria

- The public website contains a clinic information section.
- The clinic information is readable on desktop and mobile devices.
- The page loads without authentication.
- The information is retrieved from the backend API or configuration source.

---

## User Story 1.2 — View Address and Contact Information

### Description

As a user, I want to view the clinic address and contact information so that I can contact or visit the clinic.

### Acceptance Criteria

- The website displays:
  - clinic address,
  - phone number,
  - email address (optional).
- Contact information is visible without login.
- The information is mobile-friendly.

---

## User Story 1.3 — View Hours of Operation

### Description

As a user, I want to view clinic working hours so that I know when the clinic is available.

### Acceptance Criteria

- The website displays clinic working hours.
- Working hours are visible without authentication.
- The layout is responsive on mobile devices.

---

# Feature 2 — Appointment Requests

## User Story 2.1 — Submit Appointment Request

### Description

As a user, I want to submit an appointment request without registration so that the clinic administration can contact me regarding ultrasound diagnostic services.

### Acceptance Criteria

- The user can open the appointment request form without login.
- The form contains:
  - full name,
  - phone number,
  - optional email,
  - service type,
  - optional comment.
- Required fields are validated.
- Invalid form submissions display validation errors.
- Successful submission stores the request in the database.
- Successful submission returns a confirmation message.
- The request receives initial status `new`.

---

## User Story 2.2 — Prevent Invalid Appointment Requests

### Description

As a system, I want to validate appointment requests so that invalid or incomplete data is not stored.

### Acceptance Criteria

- Required fields cannot be empty.
- Phone number format is validated.
- Backend validation exists independently of frontend validation.
- Invalid requests return appropriate API error responses.

---

## User Story 2.3 — Protect Appointment Form from Spam

### Description

As a clinic administrator, I want appointment requests to be protected from spam so that the system remains usable.

### Acceptance Criteria

- Appointment request submissions are limited to 5 requests per source IP within a rolling 15-minute window.
- Excessive requests are rejected with HTTP 429 Too Many Requests.
- Rate limit responses include a correct Retry-After response header.
- Rate-limited appointment requests are logged without storing sensitive form data in logs.
- Spam protection works entirely on the backend and independently of frontend validation.

---

# Feature 3 — Admin Authentication

## User Story 3.1 — Admin Login

### Description

As an administrator, I want to log into the admin panel so that I can manage appointment requests securely.

### Acceptance Criteria

- The admin login form accepts username/email and password.
- Passwords are stored securely in the database.
- Invalid credentials return authentication errors.
- Successful login creates an authenticated admin session or token.
- Unauthenticated users cannot access admin endpoints.

---

## User Story 3.2 — Admin Logout

### Description

As an administrator, I want to log out so that unauthorized users cannot access the admin panel from my device.

### Acceptance Criteria

- The administrator can log out from the admin panel.
- Authentication tokens or sessions become invalid after logout.
- Protected routes become inaccessible after logout.

---

# Feature 4 — Appointment Management

## User Story 4.1 — View, Search, and Sort Appointment Requests

### Description

As an administrator, I want to view, search, and sort submitted appointment requests so that I can quickly find and process requests.

### Acceptance Criteria

- The admin panel displays a list of appointment requests.
- Each request displays:
  - full name,
  - phone number,
  - email,
  - service type,
  - comment,
  - current status,
  - creation date.
- Only authenticated administrators can access the list.
- Data is retrieved from PostgreSQL through the backend API.
- The administrator can search appointment requests by:
  - full name,
  - phone number,
  - email,
  - service type,
  - comment,
  - status.
- The administrator can sort appointment requests by:
  - full name,
  - phone number,
  - email,
  - service type,
  - status,
  - creation date.
- The default order is newest requests first.
- Search and sorting are handled by the backend API.
- Search and sorting results remain consistent after page reload.

---

## User Story 4.2 — Change Appointment Status

### Description

As an administrator, I want to change appointment request status so that I can track request processing.

### Acceptance Criteria

- The administrator can change request status.
- Allowed statuses:
  - `new`,
  - `contacted`,
  - `confirmed`,
  - `cancelled`,
  - `completed`.
- Status changes are persisted in the database.
- Updated status appears immediately in the admin panel.

---

# Feature 5 — Clinic Information Management

## User Story 5.1 — Update Clinic Information

### Description

As an administrator, I want to update clinic information so that the website always contains актуальні дані.

### Acceptance Criteria

- The administrator can update:
  - clinic description,
  - address,
  - contact information,
  - working hours.
- Changes are saved in the database.
- Updated information becomes visible on the public website.
- Only authenticated administrators can modify clinic information.

---

# Feature 6 — Privacy and Security

## User Story 6.1 — View Privacy Policy

### Description

As a user, I want to read the privacy policy so that I understand how my data is processed.

### Acceptance Criteria

- The website contains a privacy policy page.
- The privacy policy is accessible without login.
- The appointment request form references the privacy policy.
- Users must confirm consent before submitting the form.

---

## User Story 6.2 — Secure API Access

### Description

As a system, I want protected API endpoints to require authentication so that sensitive data is not publicly accessible.

### Acceptance Criteria

- Admin API endpoints require authentication.
- Unauthorized requests return HTTP 401 or 403 responses.
- Public endpoints remain accessible without login.
- Authentication is validated on the backend.
