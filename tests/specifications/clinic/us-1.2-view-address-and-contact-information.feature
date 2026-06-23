Feature: View address and contact information
  As a public website visitor
  I want to view the clinic address and contact information
  So that I can contact or visit the clinic

  Scenario: Public visitor retrieves address and contact information without authentication
    Given clinic address and contact information are available through the backend
    When the visitor requests GET "/api/v1/clinic-information" without authentication
    Then the response status is 200
    And the response contains the clinic address and phone number
    And the response contains the email address when one is configured

  Scenario: Public visitor sees address and contact information on the website
    Given the backend API returns clinic address and contact information
    When the visitor opens the public website
    Then the clinic address and contact information section is displayed
    And the section displays the clinic address and phone number returned by the backend API
    And the section displays the email address when the backend API provides one

  Scenario: Public visitor sees address and phone number when email is unavailable
    Given the backend API returns clinic address and phone number without an email address
    When the visitor opens the public website
    Then the clinic address and contact information section is displayed
    And the section displays the clinic address and phone number returned by the backend API
    And no email address is shown

  Scenario Outline: Contact information remains readable at supported viewport sizes
    Given the backend API returns clinic address and contact information
    And the viewport width is <viewport_width> pixels
    When the visitor opens the public website
    Then the clinic address and contact information section is readable without horizontal page scrolling

    Examples:
      | viewport_width |
      | 375            |
      | 1280           |
