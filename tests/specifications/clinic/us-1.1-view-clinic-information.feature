Feature: View clinic information
  As a public website visitor
  I want to view information about the ultrasound diagnostic center
  So that I can understand what services the clinic provides

  Scenario: Public visitor retrieves clinic information without authentication
    Given clinic information is available through the backend
    When the visitor requests GET "/api/v1/clinic-information" without authentication
    Then the response status is 200
    And the response contains the clinic name and description

  Scenario: Public visitor sees clinic information from the backend API
    Given the backend API returns clinic information
    When the visitor opens the public website
    Then a clinic information section is displayed
    And the section displays the clinic name and description returned by the backend API

  Scenario Outline: Clinic information remains readable at supported viewport sizes
    Given the backend API returns clinic information
    And the viewport width is <viewport_width> pixels
    When the visitor opens the public website
    Then the clinic information is readable without horizontal page scrolling

    Examples:
      | viewport_width |
      | 375            |
      | 1280           |
