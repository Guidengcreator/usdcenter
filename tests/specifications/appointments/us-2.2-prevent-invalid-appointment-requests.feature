Feature: Prevent invalid appointment requests
  As the system
  I want to validate appointment requests
  So that invalid or incomplete data is not stored

  Scenario: Reject an appointment request without required fields
    Given the appointment request API is publicly accessible
    When the user submits an appointment request without full name and phone number
    Then the response status should be 400
    And the response should contain validation errors for the missing fields
    And the appointment request should not be stored

  Scenario: Reject an appointment request with an invalid phone number format
    Given the appointment request API is publicly accessible
    When the user submits an appointment request with phone number "abc123"
    Then the response status should be 400
    And the response should contain a phone number validation error
    And the appointment request should not be stored
