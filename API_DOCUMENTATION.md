# API Documentation

This document outlines the RESTful API endpoints available in UniTickets. All secured routes require the `Authorization: Bearer <token>` header.

---

## Authentication Routes

### `POST /auth/login`
Authenticates a user and returns a JSON Web Token.
- **Auth Required:** No
- **Request Body:** `{ "email": "user@ua.aw", "password": "password123" }`
- **Response:** `{ "token": "jwt_token_string", "user": { "id": "...", "role": "STUDENT", "name": "...", "email": "..." } }`

### `POST /auth/register-request`
Submits a request to create a new user account. Triggers a verification email.
- **Auth Required:** No
- **Request Body:** `{ "name": "...", "studentId": "...", "email": "...", "password": "...", "confirmPassword": "..." }`
- **Response:** `{ "message": "Account request submitted..." }`

### `POST /auth/resend-verification`
Generates a new verification token and resends the verification email.
- **Auth Required:** No
- **Request Body:** `{ "email": "user@ua.aw" }`
- **Response:** `{ "message": "If an unverified account exists..." }`

### `POST /auth/verify-email`
Verifies a newly registered email utilizing the token provided in the email link.
- **Auth Required:** No
- **Request Body:** `{ "token": "..." }`
- **Response:** `{ "message": "Email verified successfully. You can now log in." }`

### `POST /auth/forgot-password`
Initiates the password reset flow.
- **Auth Required:** No
- **Request Body:** `{ "email": "user@ua.aw" }`
- **Response:** `{ "message": "If an account exists for this email, a password reset link has been sent." }`

### `POST /auth/reset-password`
Resets a user's password using a valid token.
- **Auth Required:** No
- **Request Body:** `{ "token": "...", "password": "new_password", "confirmPassword": "new_password" }`
- **Response:** `{ "message": "Password reset successful. Please log in." }`

---

## Tickets Routes

### `GET /tickets`
Retrieves a list of tickets. Students see their own tickets; Admins/Class Reps see all tickets.
- **Auth Required:** Yes
- **Response:** `[ { "id": "...", "title": "...", "status": "...", ... } ]`

### `POST /tickets`
Creates a new ticket.
- **Auth Required:** Yes
- **Request Body:** `{ "title": "...", "category": "...", "type": "...", "description": "...", "priority": "..." }`
- **Response:** `{ "id": "...", "title": "..." }`

### `PUT /tickets/:id`
Updates a ticket's status, priority, or assignee.
- **Auth Required:** Yes (CLASS_REP, ADMIN)
- **Request Body:** `{ "status": "...", "assignedToId": "..." }`
- **Response:** `{ "id": "...", "status": "..." }`

### `DELETE /tickets/:id`
Deletes a ticket.
- **Auth Required:** Yes (ADMIN)
- **Response:** `{ "message": "Ticket deleted successfully." }`

---

## Tasks Routes

### `GET /tasks`
Retrieves tasks assigned to or created by the user.
- **Auth Required:** Yes (CLASS_REP, ADMIN)
- **Response:** `[ { "id": "...", "title": "...", "status": "..." } ]`

### `POST /tasks`
Creates a new actionable task.
- **Auth Required:** Yes (CLASS_REP, ADMIN)
- **Request Body:** `{ "title": "...", "description": "...", "assignedToId": "..." }`
- **Response:** `{ "id": "...", "title": "..." }`

### `PUT /tasks/:id`
Updates a task's status.
- **Auth Required:** Yes (CLASS_REP, ADMIN)
- **Request Body:** `{ "status": "DONE" }`
- **Response:** `{ "id": "...", "status": "DONE" }`

### `DELETE /tasks/:id`
Deletes a task.
- **Auth Required:** Yes (CLASS_REP, ADMIN)
- **Response:** `{ "message": "Task deleted successfully." }`

---

## Users (Admin) Routes

### `GET /users`
Retrieves all registered users in the system.
- **Auth Required:** Yes (ADMIN)
- **Response:** `[ { "id": "...", "email": "...", "role": "...", "approvalStatus": "..." } ]`

### `PUT /users/:id/role`
Updates a user's role.
- **Auth Required:** Yes (ADMIN)
- **Request Body:** `{ "role": "CLASS_REP" }`
- **Response:** `{ "id": "...", "role": "CLASS_REP" }`

### `PUT /users/:id/status`
Approves, rejects, activates, or deactivates a user.
- **Auth Required:** Yes (ADMIN)
- **Request Body:** `{ "approvalStatus": "APPROVED", "isActive": true }`
- **Response:** `{ "id": "...", "approvalStatus": "APPROVED" }`
