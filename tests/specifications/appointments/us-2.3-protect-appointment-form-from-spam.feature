Feature: Protect appointment form from spam
  As a clinic administrator
  I want appointment requests to be protected from spam
  So that the system remains usable

  Background:
    Given the appointment request API is publicly accessible
    And the appointment request limit is 5 requests per source IP within a rolling 15-minute window

  Scenario: Accept appointment requests below the rate limit
    When a client submits 5 valid appointment requests from the same source IP
    Then each response status should be 201
    And each appointment request should be stored

  Scenario: Reject appointment requests after the rate limit is reached
    Given a client has submitted 5 appointment requests from the same source IP within the current 15-minute window
    When the client submits one more valid appointment request
    Then the response status should be 429
    And the response should contain a rate limit error
    And the response should contain a Retry-After header
    And the excessive appointment request should not be stored

  Scenario: Reset the rate limit after the rolling window expires
    Given the appointment request API is publicly accessible
    And a client has submitted 5 appointment requests from the same source IP within the current 15-minute window
    When 15 minutes pass after the oldest counted request
    And the client submits one more valid appointment request
    Then the response status should be 201
    And the appointment request should be stored

  Scenario: Track rate limits independently by source IP
    Given a client has submitted 5 appointment requests from one source IP within the current 15-minute window
    When another client submits a valid appointment request from a different source IP
    Then the response status should be 201
    And the appointment request should be stored

  Scenario: Log suspicious appointment request activity without sensitive form data
    Given a client has submitted 5 appointment requests from the same source IP within the current 15-minute window
    When the client submits one more valid appointment request with personal form data
    Then the response status should be 429
    And the suspicious activity should be logged
    And the log entry should not contain the submitted full name, phone number, email, service type, or comment

  Scenario: Protect the backend when frontend validation is bypassed
    Given a client bypasses the frontend and submits requests directly to the backend API
    And the client has submitted 5 appointment requests from the same source IP within the current 15-minute window
    When the client submits one more valid appointment request directly to the backend API
    Then the response status should be 429
    And the excessive appointment request should not be stored
