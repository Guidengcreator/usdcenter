# Test Case Scope Matrix
#
# | ID | Acceptance criterion | Business rule | Valid input classes | Invalid input classes and boundaries | Normalization / persistence / response expectations | Scenario |
# | US3.1-M01 | AC1, AC3 | Login requires email and password. | email and password are non-empty strings. | omitted email, omitted password, empty strings, whitespace-only strings, malformed email. | Rejected requests return 400 VALIDATION_ERROR and create no session. | Reject login requests with missing or invalid required fields |
# | US3.1-M02 | AC1, AC4 | Email is normalized consistently before lookup. | mixed-case email with surrounding spaces. | none. | Login succeeds for normalized email and creates a session for the stored admin. | Normalize admin email before authenticating |
# | US3.1-M03 | AC2 | Admin passwords are stored only as secure hashes. | seeded or inserted admin with password hash. | plain-text password value. | Database stores a hash that differs from the plain password; API responses do not include password hashes. | Store admin passwords as hashes only |
# | US3.1-M04 | AC3 | Invalid credentials return a generic authentication error. | none. | wrong password for existing email, unknown email. | Both return identical 401 AUTHENTICATION_FAILED response shape and create no session. | Reject invalid credentials without revealing whether the email exists |
# | US3.1-M05 | AC4 | Successful login creates a server-side session and sends an opaque session id cookie. | correct normalized email and password. | none. | Session row is created, Set-Cookie is HTTP-only, SameSite is configured, Path is admin API path, Max-Age/Expires aligns with session expiration, cookie value is not admin data or JWT payload. | Create a server-side admin session after successful login |
# | US3.1-M06 | AC5 | Protected admin endpoints require a valid, unexpired session. | request with valid session cookie. | missing cookie, invalid session id, expired session id. | Missing, invalid, and expired sessions return 401 AUTHENTICATION_FAILED; valid session returns safe admin id/email only. | Protect admin session endpoint with server-side sessions |
# | US3.1-M07 | AC5 | Public endpoints remain public. | unauthenticated public clinic-information request. | none. | Public endpoint remains accessible without an admin cookie. | Keep public endpoints accessible without authentication |
# | US3.1-M08 | AC2, AC3, AC4, AC5 | Sensitive auth material is not logged. | invalid and successful login attempts. | password, password hash, full session id. | Logs do not contain submitted passwords, stored hashes, or full session ids. | Avoid logging passwords, password hashes, and session ids |
# | US3.1-M09 | AC1, AC3, AC4 | Frontend login form collects credentials and maps auth errors safely. | user-entered email/password, successful backend response. | 401 authentication error. | UI posts to POST /api/v1/admin/login with credentials and credentials include cookies; shows friendly auth error; never writes session id to localStorage/sessionStorage. | Submit admin login form without exposing the session id |

Feature: User Story 3.1 - Admin Login
  As an administrator
  I want to log into the admin panel
  So that I can manage appointment requests securely

  Background:
    Given an admin user exists with email "admin@example.com" and password "correct-password"

  Scenario Outline: Reject login requests with missing or invalid required fields
    When an admin login request is submitted with <payload>
    Then the API response status is 400
    And the API response error code is "VALIDATION_ERROR"
    And no admin session is created

    Examples:
      | payload                                                |
      | {"password":"correct-password"}                        |
      | {"email":"admin@example.com"}                          |
      | {"email":"","password":"correct-password"}             |
      | {"email":"   ","password":"correct-password"}          |
      | {"email":"not-an-email","password":"correct-password"} |
      | {"email":"admin@example.com","password":""}            |
      | {"email":"admin@example.com","password":"   "}         |

  Scenario: Normalize admin email before authenticating
    When an admin login request is submitted with email "  ADMIN@EXAMPLE.COM  " and password "correct-password"
    Then the API response status is 200
    And a server-side admin session is created for "admin@example.com"

  Scenario: Store admin passwords as hashes only
    Then the stored admin password is not "correct-password"
    When the admin logs in with email "admin@example.com" and password "correct-password"
    Then the API response does not include a password hash
    And the protected session response does not include a password hash

  Scenario Outline: Reject invalid credentials without revealing whether the email exists
    When an admin login request is submitted with email <email> and password <password>
    Then the API response status is 401
    And the API response error body is the generic authentication failure
    And no admin session is created

    Examples:
      | email               | password       |
      | "admin@example.com" | "wrong-secret" |
      | "unknown@example.com" | "wrong-secret" |

  Scenario: Create a server-side admin session after successful login
    When the admin logs in with email "admin@example.com" and password "correct-password"
    Then the API response status is 200
    And exactly one server-side admin session is stored
    And the response includes an HTTP-only admin session cookie
    And the cookie contains an opaque session id
    And the cookie has SameSite configured
    And the cookie expiration matches the server-side session policy

  Scenario Outline: Protect admin session endpoint with server-side sessions
    Given the admin session cookie is <cookie_state>
    When the admin session endpoint is requested
    Then the API response status is <status>
    And the API response body contains <body_expectation>

    Examples:
      | cookie_state | status | body_expectation |
      | missing      | 401    | generic authentication failure |
      | invalid      | 401    | generic authentication failure |
      | expired      | 401    | generic authentication failure |
      | valid        | 200    | safe admin id and email |

  Scenario: Keep public endpoints accessible without authentication
    When the public clinic information endpoint is requested without an admin cookie
    Then the endpoint does not require admin authentication

  Scenario: Avoid logging passwords, password hashes, and session ids
    When invalid and successful admin login requests are processed
    Then logs do not contain submitted passwords
    And logs do not contain stored password hashes
    And logs do not contain full session identifiers

  Scenario: Submit admin login form without exposing the session id
    Given the admin login page is open
    When the administrator enters an email and password
    And submits the admin login form
    Then the frontend sends credentials to "POST /api/v1/admin/login"
    And invalid credentials show a user-friendly authentication error
    And successful login shows the admin session page
    And no session id is stored in localStorage or sessionStorage
