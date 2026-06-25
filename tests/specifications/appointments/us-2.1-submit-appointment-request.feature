Feature: Submit appointment request
  As a public user
  I want to submit an appointment request without registration
  So that the clinic administration can contact me regarding ultrasound diagnostic services

  Scenario: Submit a valid appointment request
    Given the appointment request API is publicly accessible
    When the user submits a valid appointment request with contact information
    Then the response status should be 201
    And the response should contain a confirmation message
    And the appointment request should be stored with status "new"

  Scenario: Reject an appointment request without required fields
    Given the appointment request API is publicly accessible
    When the user submits an appointment request without full name and phone number
    Then the response status should be 400
    And the response should contain a validation error
    And the appointment request should not be stored
