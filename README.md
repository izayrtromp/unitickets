# UniTickets

A centralized platform for students and class representatives to report, track, and manage academic concerns.

## Overview

UniTickets streamlines communication and accountability between students, class representatives, and university administration. By providing a structured issue tracking system, it ensures that academic feedback, feature requests, and complaints are captured, assigned, and resolved efficiently.

## Key Features

- **Ticket Reporting System:** Allows students to submit academic concerns with categorized details.
- **Task Management:** Class representatives and admins can link actionable tasks directly to reported tickets.
- **Meeting Scheduling:** Coordinate and document meetings to discuss pending tickets.
- **Role-Based Access Control (RBAC):** Distinct permissions for Students, Class Representatives, and Administrators.
- **Email Verification System:** Secure domain-based self-registration for authorized students.
- **Password Reset System:** Self-serve, secure password recovery using expiring, single-use tokens.
- **Activity Tracking:** Comprehensive timeline of comments, status changes, and notifications.
- **Dashboard Analytics:** High-level metrics for quick insights into organizational performance.

## Technology Stack

- **Frontend:** React (powered by Vite)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL (hosted via Supabase)
- **ORM:** Prisma Client
- **Authentication:** JSON Web Tokens (JWT)
- **Email Delivery:** Nodemailer (via SMTP)
- **Hosting / Deployment:** Vercel (Frontend), Render/Fly.io (Backend)

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL
- SMTP Server Credentials (e.g., Gmail App Password)

### 1. Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@host:port/dbname"
JWT_SECRET="your_super_secret_jwt_key"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_USER="your-email@example.com"
EMAIL_PASS="your-app-password"
FRONTEND_URL="http://localhost:5173"
PORT="5001"
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL="http://localhost:5001/api"
```

### 2. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Documentation Directory

For deeper insights into the project, review the following documentation files:

- [Product Overview](./PRODUCT_OVERVIEW.md)
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Security Overview](./SECURITY_OVERVIEW.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Changelog](./CHANGELOG.md)
