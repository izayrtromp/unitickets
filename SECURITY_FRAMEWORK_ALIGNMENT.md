# UniTickets Security Framework Alignment

## 1. Overview
UniTickets utilizes industry-standard cybersecurity frameworks to guide the design, implementation, and maintenance of its web application security posture. By aligning with recognized standards, UniTickets ensures robust access control, secure account handling, comprehensive auditability, and production readiness. 

This document serves as a practical mapping of how UniTickets aligns with the following frameworks:
- **OWASP Application Security Verification Standard (ASVS) 5.0**
- **OWASP Top 10 2025**
- **CIS Controls v8.1**
- **NIST Cybersecurity Framework (CSF) 2.0**

This alignment is designed to provide project stakeholders, lecturers, and future institutional adopters with a clear understanding of the application's security maturity and the roadmap for continuous improvement.

---

## 2. OWASP ASVS 5.0 Alignment
The Application Security Verification Standard provides a basis for testing web application technical security controls.

| Category | Status | Details |
| :--- | :--- | :--- |
| **Authentication** | Partially Implemented | Passwords are securely hashed with bcrypt. Email verification is required. A stronger password policy (complexity rules) is recommended. |
| **Session Management** | Partially Implemented | JWTs are short-lived (1h) and the frontend enforces inactivity logouts, multi-tab sync, and global 401 handling. Transitioning from localStorage to `httpOnly` secure cookies is planned. |
| **Access Control** | Implemented | Strict Role-Based Access Control (RBAC) middleware protects all backend routes. Students are isolated to their own ticket data. |
| **Input Validation** | Partially Implemented | JSON payloads are strictly limited in size (1MB). Type and enum validation is present, but stricter backend character length validations are needed for all free-text fields. |
| **API Security** | Implemented | APIs are protected by Helmet (secure headers), rate limiting, and a strictly whitelisted CORS policy. |
| **Error Handling** | Implemented | The backend avoids exposing stack traces or raw database query errors to the client. |
| **Logging and Monitoring** | Partially Implemented | Administrative actions are robustly logged to an internal `AuditLog` table with sensitive metadata sanitized. External alerting/monitoring solutions are not yet integrated. |
| **Data Protection** | Implemented | Database connections are secure, and passwords/reset tokens are never exposed in API responses or logs. |

---

## 3. OWASP Top 10 2025 Mapping
The OWASP Top 10 represents a broad consensus on the most critical security risks to web applications.

- **Broken Access Control:** Addressed via strict RBAC middleware (`authorizeRoles`), student data isolation constraints, and global 401 expiration handling.
- **Security Misconfiguration:** Mitigated by using Helmet for HTTP headers, separating `.env` configurations, and maintaining an explicit CORS whitelist.
- **Software Supply Chain Failures:** Mitigated by regular dependency audits (`npm audit`) and restricting the use of unnecessary third-party packages.
- **Cryptographic Failures:** Addressed by utilizing industry-standard `bcrypt` for password hashing and secure random bytes for reset/verification tokens.
- **Injection:** Mitigated by utilizing Prisma ORM, which inherently parametrizes all database queries to prevent SQL injection.
- **Insecure Design:** Addressed by incorporating controlled ticketing workflows (e.g., ticket reopen limits, unverified account cleanup scripts) directly into the business logic.
- **Authentication Failures:** Mitigated via email verification mandates, secure password reset flows with single-use tokens, and rate limiters on login attempts.
- **Software and Data Integrity Failures:** Mitigated by ensuring continuous cross-tab session syncing and controlled backend-enforced status transitions for tickets.
- **Security Logging and Alerting Failures:** Mitigated through a dedicated administrative `AuditLog` system that records critical RBAC and user-state modifications. 
- **Mishandling Exceptional Conditions:** Addressed by the implementation of a 1MB payload limit and manual fallback database cleanup queries to prevent cascading failure crashes.

---

## 4. CIS Controls v8.1 Mapping
The Center for Internet Security (CIS) Controls provide prioritized safeguards to mitigate the most prevalent cyber attacks.

- **Account Management:** UniTickets enforces strictly controlled registration limited to institutional domains, mandates email verification, and provides admin interfaces to deactivate, approve, or reject accounts. Expired unverified accounts are automatically cleaned up.
- **Access Control Management:** Admin-only interfaces manage role assignments. Access is strictly delineated between Students, Class Representatives, and Administrators.
- **Vulnerability Management:** Handled via continuous Node.js and React dependency audits.
- **Audit Log Management:** All critical account modifications, role escalations, and system configuration changes are securely stored in the database's `AuditLog` table.
- **Data Protection:** Secrets and tokens are sanitized from audit logs, passwords are never stored in plaintext, and data transitions are strictly monitored.
- **Secure Configuration:** Production environments utilize proxy trust configurations, size limits on data parsing, and secure API headers.
- **Service Provider / Cloud Environment Awareness:** Deployed with distinct development and production configurations, ensuring environmental separation.

---

## 5. NIST Cybersecurity Framework (CSF) 2.0 Mapping
The NIST CSF organizes core cybersecurity activities at their highest level.

- **Govern:** Security requirements are established around an institutional ticketing workflow. RBAC rules dictate exact organizational access levels.
- **Identify:** Risk assessments (such as the production security audits) identify critical data paths, including institutional emails and student IDs. 
- **Protect:** Implemented via JWT authentication, CORS restrictions, rate limiting, and bcrypt hashing.
- **Detect:** Achieved through the comprehensive administrative Audit Log dashboard that tracks role changes and data deletions.
- **Respond:** Features like the global 401 frontend interceptor and the ability for admins to instantly deactivate compromised users provide rapid response mechanisms.
- **Recover:** Passwords can be securely recovered via email, and robust manual data deletion logic prevents database corruption. (Note: Full database backup procedures must be managed by the host provider).

---

## 6. UniTickets Current Implemented Protections
The application currently actively enforces the following security controls:
- **Institutional Email Registration:** Restricts sign-ups to verified institutional domains.
- **Email Verification:** Prevents access until email ownership is proven.
- **Password Hashing:** Industry-standard `bcrypt` hashing for all credentials.
- **Password Reset:** Secure, expiring, single-use token workflow.
- **Short-Lived Sessions:** JWTs expire in 1 hour.
- **Inactivity Logout & Multi-Tab Sync:** Frontend automatically logs users out upon inactivity and synchronizes logout events across all open browser tabs.
- **Global 401 Handler:** Intercepts expired sessions and forces a clean redirect to the login portal.
- **RBAC (Role-Based Access Control):** Backend middleware explicitly authenticates and authorizes user roles for every endpoint.
- **Admin Audit Logs:** Granular tracking of sensitive administrative actions (e.g., role changes, user deactivation).
- **Unverified Account Cleanup:** Admin tool to securely purge abandoned/fake accounts.
- **Input Payload Limit:** Backend rejects JSON payloads larger than 1MB to prevent DOS.
- **Helmet & CORS:** HTTP headers are secured, and API access is restricted to approved origins.
- **Rate Limiting:** Prevents brute-force and enumeration attacks on auth endpoints (with proper proxy trust configuration).
- **Ticket Ownership Controls:** Students are strictly prevented from viewing or modifying tickets belonging to others.
- **Controlled Ticket Reopening:** Business logic enforces a cooldown and maximum limit on ticket reopen attempts.

---

## 7. Remaining Recommended Improvements
To achieve full enterprise-grade production readiness, the following enhancements are scheduled for future iterations:
- **Stricter Backend Input Validation:** Implementation of rigorous minimum/maximum character limits on all free-text fields (e.g., ticket descriptions, comments, agenda notes).
- **Stronger Password Policy:** Enforcing complexity requirements (uppercase, lowercase, numbers, symbols) during registration.
- **Redis-Backed Rate Limiting:** Transitioning from in-memory rate limiters to a distributed Redis store to properly support horizontally scaled or serverless production environments.
- **httpOnly Cookie Session Storage:** Moving JWT storage out of `localStorage` and into `httpOnly`, `Secure` cookies to completely eliminate the risk of XSS token theft.
- **Better Monitoring & Alerting:** Integrating external application performance monitoring (APM) and security alerting tools (e.g., Sentry, Datadog).
- **Dependency Update Routine:** Automating vulnerability scanning and patching via tools like Dependabot.
- **Backup & Recovery Procedure:** Formalizing automated daily database backups and establishing an institutional disaster recovery protocol.
