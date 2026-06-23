Feature: View hours of operation
  As a public website visitor
  I want to view clinic working hours
  So that I know when the clinic is available

  Scenario: Public visitor retrieves working hours without authentication
    Given clinic working hours are available through the backend
    When the visitor requests GET "/api/v1/clinic-information" without authentication
    Then the response status is 200
    And the response contains the clinic working hours

  Scenario: Public visitor sees working hours on the website
    Given the backend API returns clinic working hours
    When the visitor opens the public website
    Then the clinic working hours are displayed

  Scenario Outline: Working hours remain readable at supported viewport sizes
    Given the backend API returns clinic working hours
    And the viewport width is <viewport_width> pixels
    When the visitor opens the public website
    Then the clinic working hours are readable without horizontal page scrolling

    Examples:
      | viewport_width |
      | 375            |
      | 1280           |
