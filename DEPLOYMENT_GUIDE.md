# Deployment Guide

This guide outlines the steps necessary to deploy UniTickets to a production environment. The application is designed to be deployed with a separated Frontend (Vercel/Netlify) and Backend (Render/Fly.io/Heroku).

---

## 1. Infrastructure Requirements

- **Database:** A hosted PostgreSQL instance (e.g., Supabase, Neon, or AWS RDS).
- **Frontend Hosting:** Vercel (recommended) or Netlify.
- **Backend Hosting:** Render, Fly.io, or Heroku.
- **SMTP Server:** An email service or a Gmail account with an "App Password" generated.

---

## 2. Environment Variables

Before deploying, ensure you have the following environment variables prepared.

### Backend `.env`
```env
# Database connection strings (Supabase example)
DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/dbname"

# Security
JWT_SECRET="generate_a_long_secure_random_string"

# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="465"
EMAIL_USER="your-university-email@gmail.com"
EMAIL_PASS="your-16-character-app-password"
EMAIL_FROM='"UniTickets" <no-reply@unitickets.edu>'

# Frontend Origin (Required for CORS and Email Links)
FRONTEND_URL="https://unitickets-six.vercel.app"
```

### Frontend `.env`
```env
# Backend API Origin
VITE_API_URL="https://your-backend-url.onrender.com/api"
```

---

## 3. Deploying the Backend (Render Example)

1. Connect your repository to Render as a "Web Service".
2. Set the Root Directory to `backend`.
3. Set the Build Command to: `npm install && npx prisma generate`
4. Set the Start Command to: `npm start` (ensure `package.json` maps `"start": "node src/index.js"`).
5. Input all Backend Environment Variables securely in the Render dashboard.
6. **Important:** Run `npx prisma db push` (or `npx prisma migrate deploy`) against your production database locally to initialize the schema before the server boots.

---

## 4. Deploying the Frontend (Vercel Example)

1. Connect your repository to Vercel.
2. Set the Root Directory to `frontend`.
3. The Build Command should automatically detect Vite (`npm run build`).
4. Output directory should be `dist`.
5. Add the `VITE_API_URL` environment variable pointing to your deployed Render URL.
6. Deploy.

---

## 5. Post-Deployment Checklist

- Create a Seed Admin: Register a user on the production frontend. Then manually access the PostgreSQL database to change their `role` to `'ADMIN'`, `isEmailVerified` to `true`, and `approvalStatus` to `'APPROVED'`.
- Validate CORS: Attempt to log in to ensure the backend is not blocking the frontend Vercel domain.
- Test Email: Register a dummy student account to confirm the SMTP App Password is functioning and successfully dispatching the verification email.
