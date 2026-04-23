# University Class Representative Ticket System

A complete full-stack web application for managing student issues, complaints, and tasks, utilizing role-based access control.

## System Architecture
- **Frontend**: React via Vite, Tailwind CSS (Runs dynamically on Port 3000)
- **Backend**: Node.js, Express, JSON Web Tokens (JWT) (Runs dynamically on Port 5000)
- **Database**: SQLite with Prisma ORM 

## Prerequisites
- Node.js (v16 or higher) installed on your system.

## Extremely Simple Setup (One Command)

We've configured everything to run automatically. The backend relies solely on an internal SQLite database, meaning there are absolutely no external dependencies to configure.

### Option 1: Using the Bash Script
Open your terminal in the root of the project and run:
```bash
sh start.sh
```

### Option 2: Using NPM Scripts manually
If you're on Windows or prefer standard npm commands, run:
```bash
# 1. First, install all dependencies (root, frontend, and backend)
npm run setup

# 2. Start the database and both servers!
npm run dev
```

*Note: Starting the server automatically mounts your `dev.db` database file and seeds it with default accounts.*

## Testing the Application

### Seed Accounts
The database has been pre-seeded with three accounts:
- **Admin**: `admin@university.edu` / `admin123`
- **Class Rep**: `rep@university.edu` / `rep123`
- **Student**: `student@university.edu` / `student123`

### Workflows Explained
1. Open up **http://localhost:3000** in your browser.
2. Log in as **Student** and submit a dummy ticket via the top right.
3. Log out and log in as **Class Rep**.
4. You will see all tickets across the system. Click on your newly created ticket.
5. Click **Assign to me** and modify the status to **In Progress**.
6. Type a comment detailing the update.
7. Log out and log back in as **Student** to view the status update and the comment safely!
