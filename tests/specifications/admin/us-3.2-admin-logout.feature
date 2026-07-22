# Test Case Scope Matrix
#
# | ID | Acceptance criterion | Business rule | Valid input classes | Invalid input classes and boundaries | Persistence / response expectations | Scenario |
# | US3.2-M01 | AC1, AC2 | A logged-in administrator can log out. | Valid `admin_session_id` cookie for an unexpired, unrevoked session. | none. | `POST /api/v1/admin/logout` returns `200` with `loggedOut: true`, marks the session revoked, and clears the cookie. | Log out with a valid admin session |
# | US3.2-M02 | AC2, AC3 | Logged-out sessions cannot authenticate protected endpoints. | Old cookie from the session that was just logged out. | none. | `GET /api/v1/admin/session` returns `401 AUTHENTICATION_FAILED` with the old cookie. | Reject the old session cookie after logout |
# | US3.2-M03 | AC1, AC2 | Logout is safe and idempotent when no valid session exists. | Missing cookie, invalid cookie, expired session cookie, already revoked session cookie. | malformed or unknown session ids. | Logout returns safe `200` response, clears cookie, never creates a session, and never authenticates the user. | Return a safe logout response without a valid session |
# | US3.2-M04 | AC2 | Logout clears the same HTTP-only cookie used for login. | Any logout request. | none. | Cleared cookie uses `admin_session_id`, `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/admin`, `Max-Age=0`, and production `Secure` policy. | Clear the admin session cookie with security attributes |
# | US3.2-M05 | AC2, AC3 | Logout must not expose sensitive data. | Valid, missing, invalid, expired, and revoked session cookies. | password, password hash, full session id, full cookie header. | Response contains only safe success data; logs do not contain sensitive auth material. | Avoid logging or returning sensitive logout data |
# | US3.2-M06 | AC3 | Public endpoints remain unauthenticated. | Public clinic information request without an admin cookie. | none. | Public endpoint still returns its normal response without authentication. | Keep public endpoints accessible after logout changes |
# | US3.2-M07 | AC1, AC2, AC3 | Frontend exposes logout in the authenticated admin view. | Logged-in admin state. | Logout network/server failure. | Button calls `POST /api/v1/admin/logout` with credentials, success shows logged-out state, failure shows friendly error, and browser storage is not used for session ids. | Log out from the admin UI |

Feature: User Story 3.2 - Admin Logout
  As an administrator
  I want to log out
  So that unauthorized users cannot access the admin panel from my device

  Background:
    Given an admin user exists with email "admin@example.com" and password "correct-password"

  Scenario: Log out with a valid admin session
    Given the administrator is logged in with a valid server-side session
    When the administrator requests logout
    Then the API response status is 200
    And the API response body is {"data":{"loggedOut":true}}
    And the server-side admin session is marked revoked
    And the response clears the HTTP-only admin session cookie

  Scenario: Reject the old session cookie after logout
    Given the administrator is logged in with a valid server-side session
    And the administrator has logged out
    When the protected admin session endpoint is requested with the old cookie
    Then the API response status is 401
    And the API response error code is "AUTHENTICATION_FAILED"

  Scenario Outline: Return a safe logout response without a valid session
    Given the admin session cookie is <cookie_state>
    When the administrator requests logout
    Then the API response status is 200
    And the API response body is {"data":{"loggedOut":true}}
    And no new admin session is created
    And the response clears the HTTP-only admin session cookie

    Examples:
      | cookie_state |
      | missing      |
      | invalid      |
      | expired      |
      | revoked      |

  Scenario: Clear the admin session cookie with security attributes
    When the administrator requests logout
    Then the response clears cookie "admin_session_id"
    And the cleared cookie has "HttpOnly"
    And the cleared cookie has "SameSite=Lax"
    And the cleared cookie has "Path=/api/v1/admin"
    And the cleared cookie has "Max-Age=0"
    And the cleared cookie uses the environment secure-cookie policy

  Scenario: Avoid logging or returning sensitive logout data
    Given the administrator is logged in with a valid server-side session
    When the administrator requests logout
    Then the API response does not include a session id
    And logs do not contain the full session id
    And logs do not contain cookies
    And logs do not contain passwords or password hashes

  Scenario: Keep public endpoints accessible after logout changes
    When the public clinic information endpoint is requested without an admin cookie
    Then the endpoint does not require admin authentication

  Scenario: Log out from the admin UI
    Given the admin login page shows an authenticated admin view
    When the administrator clicks the logout button
    Then the frontend sends credentials to "POST /api/v1/admin/logout"
    And successful logout shows the logged-out state
    And failed logout shows a user-friendly error
    And no session id is stored in localStorage or sessionStorage
