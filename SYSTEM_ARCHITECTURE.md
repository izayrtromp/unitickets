# System Architecture

UniTickets follows a decoupled Client-Server architecture, ensuring high scalability and distinct separation of concerns. 

## Architectural Flow

The primary data flow of the application operates as follows:

\`React Frontend (Vite) → Express API → Prisma ORM → PostgreSQL Database\`

1. **Client Tier:** The frontend is a Single Page Application (SPA) built with React. It communicates with the backend exclusively via RESTful JSON APIs.
2. **Application Tier:** The Express server acts as the API gateway. It validates input, processes business logic, and ensures secure token-based authentication.
3. **Data Tier:** Prisma ORM bridges the Node.js application and the PostgreSQL database, guaranteeing type-safety and protecting against SQL injection by utilizing parameterized queries automatically.

## Authentication Flow

Authentication is strictly managed via JSON Web Tokens (JWT).

1. **Login:** User submits credentials → Express verifies bcrypt hash → A short-lived JWT (1h expiry) is signed and returned.
2. **Protected Routes:** The frontend stores the JWT locally and attaches it to the `Authorization: Bearer <token>` header on subsequent requests.
3. **Authorization:** Express middleware validates the JWT signature and enforces Role-Based Access Control (RBAC) before fulfilling the request.

## Email Integration Flows

UniTickets utilizes Nodemailer to facilitate critical out-of-band security mechanisms:

### Email Verification
- During registration, an inactive user is created alongside a secure 32-byte hex `verificationToken` expiring in 1 hour.
- An email containing the frontend verification link is dispatched.
- Upon clicking the link, the token is verified and securely nullified to prevent reuse. The account is then activated.

### Password Recovery
- An unauthenticated user requests a password reset link.
- If the email exists, a `passwordResetToken` is generated with a 1-hour expiry.
- When submitting the new password, the token is validated. If valid, the password hash is updated and the token is nullified atomically.

## Environment Separation

The application strictly separates environments using `dotenv`.
- **Local Development:** Frontend operates on `http://localhost:5173` and backend operates on `http://localhost:5001`. CORS explicitly allows these origins.
- **Production:** Frontend targets the deployed API URL, and the backend CORS whitelist restricts access strictly to the production frontend domain (e.g., `https://unitickets-six.vercel.app`), mitigating Cross-Site Request Forgery (CSRF).
