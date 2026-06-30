Feature: Prevent invalid appointment requests
  As the system
  I want to validate appointment requests
  So that invalid or incomplete data is not stored

  Background:
    Given the appointment request API is publicly accessible

  Scenario Outline: Reject an appointment request when required fields are missing
    When the user submits an appointment request with "<missing_fields>" omitted
    Then the response status should be 400
    And the response should contain validation errors for "<expected_errors>"
    And the appointment request should not be stored

    Examples:
      | missing_fields       | expected_errors         |
      | full name            | full name               |
      | phone number         | phone number            |
      | full name and phone  | full name, phone number |

  Scenario Outline: Reject an appointment request when required fields are empty
    When the user submits an appointment request with full name "<full_name>" and phone number "<phone>"
    Then the response status should be 400
    And the response should contain validation errors for "<expected_errors>"
    And the appointment request should not be stored

    Examples:
      | full_name       | phone           | expected_errors         |
      | empty           | 0671234567      | full name               |
      | whitespace-only | 0671234567      | full name               |
      | Test Patient    | empty           | phone number            |
      | Test Patient    | whitespace-only | phone number            |
      | empty           | empty           | full name, phone number |
      | whitespace-only | whitespace-only | full name, phone number |

  Scenario Outline: Store a valid Ukrainian phone number in normalized format
    When the user submits an appointment request with phone number "<phone>"
    Then the response status should be 201
    And the appointment request should be stored with phone number "<normalized_phone>"

    Examples:
      | phone               | normalized_phone |
      | +380671234567       | +380671234567    |
      | +380 67 123 45 67   | +380671234567    |
      | +380 (67) 123-45-67 | +380671234567    |
      | 0671234567          | +380671234567    |
      | 067 123 45 67       | +380671234567    |
      | 067 123-45-67       | +380671234567    |
      | 0 (67) 123-45-67    | +380671234567    |

  Scenario Outline: Reject an appointment request with an invalid phone number format
    When the user submits an appointment request with phone number "<phone>"
    Then the response status should be 400
    And the response should contain a phone number validation error
    And the appointment request should not be stored

    Examples:
      | phone               | invalid_case                         |
      | abc123              | letters are not allowed              |
      | +38067123456        | international number is too short    |
      | +3806712345678      | international number is too long     |
      | 096880743           | national number is too short         |
      | 09688074341         | national number is too long          |
      | +1 202 555 0174     | non-Ukrainian country code           |
      | 380671234567        | international number is missing plus |
      | +0671234567         | national number must not use plus    |
      | 67 123 45 67        | national number is missing leading 0 |
      | +380.67.123.45.67   | unsupported separator                |
      | +380/67/123/45/67   | unsupported separator                |
      | +380+671234567      | plus sign appears more than once     |
      | 067+1234567         | plus sign appears inside the number  |

  Scenario: Validate appointment request data on the backend independently of frontend validation
    When a direct API client submits an invalid appointment request that bypasses frontend validation
    Then the response status should be 400
    And the response should contain validation errors
    And the appointment request should not be stored

  Scenario: Return a structured API error response for invalid appointment request data
    When the user submits an invalid appointment request
    Then the response status should be 400
    And the response should contain error code "VALIDATION_ERROR"
    And the response should contain error message "Invalid request data"
    And the response should contain validation error details
    And the appointment request should not be stored
