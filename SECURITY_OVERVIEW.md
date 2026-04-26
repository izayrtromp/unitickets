# Security Overview

UniTickets implements industry-standard security practices to protect user data, ensure system integrity, and mitigate common web vulnerabilities.

## 1. Authentication & Authorization

- **Password Hashing:** All user passwords are computationally hashed and salted using `bcryptjs` (salt rounds: 10) before resting in the database. Plaintext passwords are never stored.
- **JWT Lifespan:** JSON Web Tokens are configured with a strict 1-hour expiration (`expiresIn: '1h'`). Short-lived tokens minimize the attack window if a token is intercepted.
- **Payload Minimization:** The JWT payload strictly contains the `userId` and `role`. Sensitive PII (like email addresses or names) is excluded from the token.
- **Role-Based Access Control (RBAC):** Backend middleware strictly enforces route-level permissions. Destructive actions and sensitive reads are structurally gated based on roles (`STUDENT`, `CLASS_REP`, `ADMIN`).

## 2. Secure Token Management (Email Flows)

Both Email Verification and Password Reset implementations utilize zero-trust principles:
- **Cryptographic Generation:** Tokens are randomly generated using `crypto.randomBytes(32).toString('hex')`.
- **Time-to-Live (TTL):** Tokens are explicitly bound to a 1-hour expiration (`verificationTokenExpires` and `passwordResetExpires`).
- **One-Time Use:** Upon successful consumption, tokens and their expiration timestamps are atomically nullified in the database, preventing replay attacks.
- **Privacy Preservation:** The `/auth/forgot-password` endpoint intentionally obfuscates the existence of emails. It always returns a generic success response to prevent account enumeration.

## 3. Network & Application Security

- **Rate Limiting:** `express-rate-limit` acts as a safeguard against brute-force, dictionary, and DDoS attacks.
  - Global API: 100 requests per 15 minutes per IP.
  - `/auth/login`: 5 attempts per 15 minutes.
  - `/auth/register-request`: 5 attempts per hour.
  - `/auth/resend-verification`: 3 attempts per 10 minutes.
- **CORS Whitelisting:** The wildcard `*` policy is strictly prohibited. Only predefined origins (the production frontend domain and local development ports) are authorized to interact with the API.
- **HTTP Headers:** `helmet` is deployed to dynamically set critical security headers (Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, etc.) to combat XSS and Clickjacking.

## 4. Database Security

- **SQL Injection Prevention:** Prisma ORM inherently mitigates SQL Injection by exclusively using parameterized database queries. No user input is directly concatenated into a raw SQL string.
- **No API Token Leakage:** The API response schemas explicitly filter out sensitive parameters (like `passwordHash`, `verificationToken`, or `passwordResetToken`) before returning JSON to the client.
