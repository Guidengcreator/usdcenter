# Test Case Scope Matrix
#
# | ID | Acceptance criteria | Business rule | Input class and boundary | Persistence expectation | API/log expectation | Scenario |
# | US-2.3-M1 | AC1, AC2, AC3, AC6 | Appointment submissions are limited per source IP | Attempts 1-4 within 15 minutes | Valid attempts are stored | HTTP 201, no Retry-After required | Allow appointment submission attempts below the limit |
# | US-2.3-M2 | AC1, AC2, AC3, AC6 | The configured maximum is inclusive | Attempt 5 within 15 minutes | Valid attempt is stored | HTTP 201 | Allow the fifth appointment submission attempt |
# | US-2.3-M3 | AC1, AC2, AC3, AC6 | Attempts above the maximum are rejected | Attempt 6 within 15 minutes | Rejected request is not stored | HTTP 429 with Retry-After seconds and RATE_LIMIT_EXCEEDED | Reject the sixth appointment submission attempt |
# | US-2.3-M4 | AC1, AC2, AC3, AC6 | Rejections continue until the window expires | Attempts 7+ within 15 minutes | Rejected requests are not stored | HTTP 429 with bounded positive Retry-After seconds | Continue rejecting additional attempts during the same window |
# | US-2.3-M5 | AC1, AC2, AC6 | Counters expire after the time window | Attempt after 15 minutes has elapsed | Valid attempt is stored | HTTP 201 | Allow appointment submission after the rate-limit window expires |
# | US-2.3-M6 | AC1, AC2, AC6 | Counters are isolated by source IP | Two IPs each submit up to their own limit | Valid attempts from each IP are stored | One IP being limited does not limit another IP | Keep rate-limit counters isolated by source IP |
# | US-2.3-M7 | AC6 | Limiter is route-specific | GET clinic information while appointment route is limited | Clinic request has no appointment persistence effect | HTTP 200 or documented clinic response, not HTTP 429 | Do not rate limit unrelated public endpoints |
# | US-2.3-M8 | AC6 | Backend enforces the limiter without frontend participation | Direct API requests through HTTP injection | Only allowed valid requests are stored | Sixth direct request returns HTTP 429 | Limit direct backend API submission attempts |
# | US-2.3-M9 | AC1, AC2, AC6 | Limiter runs before validation and business logic | Malformed/invalid submissions from same IP | Invalid attempts are not stored; rate-limited attempts are not validated or stored | Sixth malformed request returns HTTP 429, not validation error | Count invalid appointment submission attempts before validation |
# | US-2.3-M10 | AC4, AC5 | Every rate-limited request emits a safe structured warning log | Rate-limited request with unique marker values in every sensitive field | Rejected request is not stored | Warning event appointment_request_rate_limited excludes sensitive field names and marker values | Log rate-limited requests without appointment form data |

Feature: US-2.3 Protect Appointment Form from Spam
  As a clinic administrator
  I want appointment requests to be protected from spam
  So that the system remains usable

  Background:
    Given the appointment request API is available
    And the appointment rate limit is 5 attempts per source IP during a 15-minute window

  Scenario: Allow appointment submission attempts below the limit
    When the same source IP submits 4 valid appointment requests within the window
    Then every response has status 201
    And 4 appointment requests are stored

  Scenario: Allow the fifth appointment submission attempt
    When the same source IP submits 5 valid appointment requests within the window
    Then every response has status 201
    And 5 appointment requests are stored

  Scenario: Reject the sixth appointment submission attempt
    When the same source IP submits 6 valid appointment requests within the window
    Then the sixth response has status 429
    And the response contains a Retry-After header in positive seconds not greater than 900
    And the response body contains error code "RATE_LIMIT_EXCEEDED"
    And only 5 appointment requests are stored

  Scenario: Continue rejecting additional attempts during the same window
    Given the same source IP has already submitted 6 appointment requests within the window
    When the same source IP submits another valid appointment request
    Then the response has status 429
    And the response contains a Retry-After header in positive seconds not greater than 900
    And no additional appointment request is stored

  Scenario: Allow appointment submission after the rate-limit window expires
    Given the same source IP has reached the appointment submission limit
    When the 15-minute window expires
    And the same source IP submits another valid appointment request
    Then the response has status 201
    And the appointment request is stored

  Scenario: Keep rate-limit counters isolated by source IP
    Given one source IP has reached the appointment submission limit
    When a different source IP submits a valid appointment request
    Then the response has status 201
    And the appointment request is stored

  Scenario: Do not rate limit unrelated public endpoints
    Given one source IP has reached the appointment submission limit
    When the same source IP requests public clinic information
    Then the clinic information response is not status 429

  Scenario: Limit direct backend API submission attempts
    When direct API clients submit appointment requests without the frontend
    Then attempts above 5 from the same source IP are rejected with status 429

  Scenario: Count invalid appointment submission attempts before validation
    When the same source IP submits 6 malformed appointment requests within the window
    Then the sixth response has status 429
    And no appointment request is stored

  Scenario: Log rate-limited requests without appointment form data
    When a rate-limited appointment request includes unique marker values in every form field
    Then a warning log event named "appointment_request_rate_limited" is emitted
    And the log includes operational rate-limit metadata
    And the log does not include the request body, sensitive field names, or submitted field values
