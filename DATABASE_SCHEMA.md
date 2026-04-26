# Database Schema

UniTickets utilizes PostgreSQL via Prisma ORM. Below is the documentation of the core tables, their purpose, and their relationships.

---

## 1. User
Represents a registered individual within the system.

**Key Fields:**
- `id` (UUID): Primary Key.
- `name` (String): Full name of the user.
- `email` (String, Unique): University email address.
- `role` (String): Permissions tier (`STUDENT`, `CLASS_REP`, `ADMIN`).
- `approvalStatus` (String): `PENDING`, `APPROVED`, or `REJECTED`.
- `isActive` (Boolean): Defines if the user can log in.
- `verificationToken` / `verificationTokenExpires`: Single-use token and TTL for email verification.
- `passwordResetToken` / `passwordResetExpires`: Single-use token and TTL for password recovery.

**Relationships:**
- Submits `Ticket` (Submitter)
- Assigned to `Ticket` (Assignee)
- Creates `Comment`, `Activity`, `Task`, `Meeting`
- Assigned to `Task`

---

## 2. Ticket
Represents an academic concern, issue, or feedback reported by a Student.

**Key Fields:**
- `id` (UUID): Primary Key.
- `title` (String): Brief summary of the issue.
- `type` (String): Classification (`BUG`, `FEATURE_REQUEST`, `ACADEMIC`, etc.).
- `priority` (String): Triaging level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
- `status` (String): Lifecycle state (`NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).

**Relationships:**
- Belongs to `User` (Submitter).
- Assigned to `User` (Assignee).
- Has many `Comment`, `Activity`, `Task`, `MeetingAgendaItem`.

---

## 3. Task
Represents an actionable item directly or indirectly linked to resolving a ticket.

**Key Fields:**
- `id` (UUID): Primary Key.
- `title` (String): Task objective.
- `status` (String): Current progress (`TODO`, `IN_PROGRESS`, `DONE`).
- `dueDate` (DateTime?): Deadline for the task.

**Relationships:**
- Assigned to `User`.
- Created by `User`.
- Optionally linked to a `Ticket`.

---

## 4. Meeting
Represents a scheduled synchronization between Class Representatives and/or Admins.

**Key Fields:**
- `id` (UUID): Primary Key.
- `title` (String): Meeting topic.
- `meetingDate` (DateTime): Scheduled time.
- `location` (String?): Physical or virtual location.

**Relationships:**
- Created by `User`.
- Has many `MeetingAgendaItem` (links tickets to be discussed).

---

## 5. Comment
Represents a textual reply left on a Ticket by any user.

**Key Fields:**
- `id` (UUID): Primary Key.
- `content` (String): The message text.

**Relationships:**
- Belongs to `Ticket`.
- Belongs to `User`.

---

## 6. Activity
An automated audit log recording changes to a ticket's state (e.g., status changes, reassignments).

**Key Fields:**
- `id` (UUID): Primary Key.
- `action` (String): Description of the automated action.

**Relationships:**
- Belongs to `Ticket`.
- Triggered by `User`.

---

## 7. Notification
Represents an alert dispatched to a user based on relevant activities (e.g., ticket assignment, new comment).

**Key Fields:**
- `id` (UUID): Primary Key.
- `message` (String): The alert description.
- `read` (Boolean): Unread vs read state.

**Relationships:**
- Belongs to `User`.
- Optionally linked to a `Ticket`.
