# Changelog

All notable changes to the UniTickets project will be documented in this file.

## [v1.0.0] - Production Ready Release

### Added
- **Core Ticketing System**: Complete CRUD lifecycle for student tickets.
- **Task Management**: Ability to create and assign tasks derived from tickets.
- **Meeting Scheduling**: Module for Class Reps to organize agendas.
- **Role-Based Access Control**: Strict `STUDENT`, `CLASS_REP`, and `ADMIN` permission models.
- **Admin Dashboard**: Interfaces for user approval, rejection, and role modification.
- **Email Verification**: Secure, time-sensitive token verification for new registrations.
- **Password Reset Flow**: Complete forgot/reset password system utilizing expiring one-time tokens.
- **System Documentation**: Comprehensive markdown files outlining architecture, APIs, and deployment.

### Security
- Integrated `helmet` for HTTP header security.
- Enforced strict CORS whitelisting, removing wildcard vulnerabilities.
- Applied `express-rate-limit` to all routes, with strict configurations on `/auth` endpoints.
- Shortened JWT lifespans to 1 hour and stripped sensitive PII from token payloads.
- Ensured absolute protection against double-submit bugs on critical frontend operations.
- Parameterized all database operations via Prisma ORM to prevent SQL Injection.

### UX Improvements
- Global Toast Notification System for seamless action feedback.
- Defensive frontend loading states and layout safety checks to prevent runtime crashes.
- "Loading..." and "Resetting..." button states to prevent duplicate user interactions.
- Added confirmation modals to all destructive actions (e.g., Deletions).
