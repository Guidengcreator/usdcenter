# Product Brief

## Product Name

УЗД Эксперт 
---

## One-Sentence Description

A simple web app for a small ultrasound diagnostic center.

---

## Target Users

Who will use this app?

Examples:
- users who needs a ultrasound diagnostic services
- ultrasound diagnostic center administration

---

## Problem Statement

Users struggle to find and make appointment to ultrasound diagnostic services.

---

## Main Goal

Help users to find and make appointment to ultrasound diagnostic services.

---

## MVP Features

ONLY the smallest useful feature set.

### Included

Public website:
- user easily find our web app 
- users can view clinic information
- users can view address and contacts
- users can view hours of operation
- users can submit appointment requests without registration

Admin panel:
- admin can log in
- admin can view appointment requests
- admin can change appointment status
- admin can update basic clinic information

Safety:
- form validation
- rate limiting
- spam protection
- privacy policy page

### NOT Included Yet
- reminders
- social features
- AI assistant


## Technical Direction

- Architecture: separated frontend, backend, and relational database.
- Frontend: React + TypeScript + Vite.
- Backend: Node.js + TypeScript + Fastify.
- Database: PostgreSQL.
- ORM: Drizzle.
- Testing approach: Test-Driven Development for backend API features.
- Backend tests: integration Web API tests.
- Test runner: Vitest.
- API test library: Supertest or Fastify inject.
- Test database: isolated PostgreSQL test database, preferably via Docker
- Cloud provider: AWS.
- Affordable first production hosting: Amazon Lightsail VPS.
- First production deployment: Docker Compose on one Lightsail instance, with React static assets, Fastify backend, PostgreSQL, HTTPS reverse proxy, and automated backups.
- Later managed deployment path: AWS Amplify Hosting, managed backend hosting, and Amazon RDS for PostgreSQL.
- Initial development: local frontend, local backend, local PostgreSQL via Docker.
- Deployment later: migrate from the Lightsail VPS to managed AWS services when traffic, availability requirements, or operational needs justify the cost.


## Architecture Philosophy

- Keep the architecture simple and modular.
- Prefer explicit code over abstraction.
- Build features incrementally.
- Avoid premature optimization.
- Use AI tools as assistants, not autonomous developers.
- Prioritize readability and maintainability.

## Non-Functional Requirements

- responsive UI
- mobile-friendly layout
- basic accessibility support
- secure password storage
- server-side validation
- structured logging
- environment-based configuration
- HTTPS in production

## Constraints

Example:
- must be buildable in 3 weeks
- minimal dependencies
- incremental development
- no microservices
- no advanced cloud infrastructure initially
- affordable hosting should be preferred for the first production deployment
- frontend and backend must remain clearly separated
- all important architecture decisions must be documented

## Success Criteria

- users can find clinic information
- users can submit appointment requests
- administrators can manage appointments
- data persists in PostgreSQL
- frontend and backend are deployed on AWS
- the project has working documentation
