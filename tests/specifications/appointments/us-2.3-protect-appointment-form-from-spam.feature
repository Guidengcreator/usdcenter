Feature: Protect appointment form from spam
  As a clinic administrator
  I want appointment requests to be protected from spam
  So that the system remains usable

  Scenario: Reject excessive appointment requests
    Given the appointment request API is publicly accessible
    And the client has already submitted the maximum allowed appointment requests in the current time window
    When the client submits one more appointment request
    Then the response status should be 429
    And the response should contain a rate limit error
    And the excessive appointment request should not be stored

  Scenario: Log suspicious appointment request activity
    Given the appointment request API is publicly accessible
    And the client has already submitted the maximum allowed appointment requests in the current time window
    When the client submits one more appointment request
    Then the suspicious activity should be logged
