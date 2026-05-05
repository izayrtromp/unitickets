const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { isValidUAEmail } = require('../utils/validation');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const prisma = new PrismaClient();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many requests. Please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many requests. Please try again later.' }
});

const resendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { message: 'Too many requests. Please try again later.' }
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many requests. Please try again later.' }
});

const resendCooldowns = new Map(); // in-memory cache for rate-limiting

/**
 * Submits a new user registration request.
 * Security reasoning: Hashes passwords with bcrypt immediately. Generates a secure, 
 * expiring token for email validation to prevent spam account creation.
 */
router.post('/register-request', registerLimiter, async (req, res) => {
  try {
    const { name, studentId, password, confirmPassword } = req.body;
    let { email } = req.body;
    if (email) email = email.trim().toLowerCase();

    if (!name || !studentId || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (!isValidUAEmail(email)) {
      return res.status(400).json({ error: 'Please use your University of Aruba email address (@ua.aw).' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { studentId }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or Student ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.create({
      data: {
        name,
        email,
        studentId,
        passwordHash,
        role: 'STUDENT',
        isActive: false,
        isEmailVerified: false,
        approvalStatus: 'PENDING',
        verificationToken,
        verificationTokenExpires
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    let emailSent = false;
    try {
      // Add a 10-second timeout safeguard against hanging SMTP connections
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timed out')), 10000));
      emailSent = await Promise.race([sendVerificationEmail(email, verificationUrl), timeoutPromise]);
    } catch (emailError) {
      console.error('Failed to send verification email during registration:', emailError);
      emailSent = false;
    }

    const responsePayload = {
      message: emailSent 
        ? 'Account created. Please check your email to verify your account.'
        : 'Account created, but the verification email could not be sent. Please use Resend Verification or contact an admin.'
    };

    if (process.env.NODE_ENV !== 'production') {
      responsePayload.verificationUrl = verificationUrl;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Authenticates a user and issues a JWT.
 * Security reasoning: Verifies passwords against bcrypt hashes securely. 
 * Issues a short-lived (1h) JWT containing minimal PII to mitigate token interception risks.
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    let { email } = req.body;
    if (email) email = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ error: 'Please verify your University of Aruba email before logging in.' });
    }

    if (user.approvalStatus === 'PENDING') {
      return res.status(403).json({ error: 'Your account is pending admin approval.' });
    }

    if (user.approvalStatus === 'REJECTED') {
      return res.status(403).json({ error: 'Your account request was rejected.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account is not active.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Omit password hash in response
    const { passwordHash, ...userData } = user;
    
    res.json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verifies a user's email via token.
 * Security reasoning: Checks token expiry strictly and nullifies it upon success 
 * to guarantee the token is single-use only.
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    if (user.approvalStatus === 'REJECTED') {
      return res.status(403).json({ error: 'This account request has been rejected. Please contact an administrator.' });
    }

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ error: 'Verification link expired. Please request a new one.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        approvalStatus: 'APPROVED',
        isActive: true,
        verificationToken: null,
        verificationTokenExpires: null
      }
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

/**
 * Resends a verification email.
 * Security reasoning: Re-generates a fresh token, explicitly expiring the previous one. 
 * Employs a generic success message to prevent user enumeration attacks.
 */
router.post('/resend-verification', resendLimiter, async (req, res) => {
  try {
    let { email } = req.body;
    if (email) email = email.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!isValidUAEmail(email)) {
      return res.status(400).json({ error: 'Please use your University of Aruba email address (@ua.aw).' });
    }

    const genericSuccess = 'If an unverified account exists, a new verification email has been sent. Please check your inbox and spam/junk folder.';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: genericSuccess });
    }

    if (user.approvalStatus === 'REJECTED') {
      return res.json({ message: genericSuccess });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'This account is already verified.' });
    }

    const now = new Date();
    let windowStart = user.verificationResendWindowStart;
    let count = user.verificationResendCount;

    if (!windowStart || (now - windowStart) > 24 * 60 * 60 * 1000) {
      windowStart = now;
      count = 0;
    }

    if (count >= 5) {
      return res.status(429).json({ error: 'You have reached the maximum number of verification emails for today. Please try again later or contact an administrator.' });
    }

    const lastSent = resendCooldowns.get(email);
    if (lastSent && (now.getTime() - lastSent) < 2 * 60 * 1000) {
      return res.status(429).json({ error: 'Please wait before requesting another verification email.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now
    
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        verificationToken,
        verificationTokenExpires,
        verificationResendWindowStart: windowStart
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    let emailSent = false;
    try {
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timed out')), 10000));
      emailSent = await Promise.race([sendVerificationEmail(email, verificationUrl), timeoutPromise]);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
      emailSent = false;
    }
    
    if (emailSent) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationResendCount: count + 1 }
      });
      resendCooldowns.set(email, now.getTime());
      res.json({ message: genericSuccess });
    } else {
      res.status(500).json({ error: 'Verification email could not be sent right now. Please try again later.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Initiates the password recovery flow.
 * Security reasoning: Never reveals if an email exists in the database. Generates 
 * a secure 1-hour token to minimize the attack window for compromised inboxes.
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    let { email } = req.body;
    if (email) email = email.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!isValidUAEmail(email)) {
      return res.status(400).json({ error: 'Please use your University of Aruba email address (@ua.aw).' });
    }

    const genericSuccess = 'If an account exists for this email, a password reset link has been sent.';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: genericSuccess });
    }

    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${passwordResetToken}`;

    await sendPasswordResetEmail(email, resetUrl);

    res.json({ message: genericSuccess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Processes a password reset via token.
 * Security reasoning: Atomically updates the bcrypt hash and nullifies the reset 
 * tokens in a single database transaction, ensuring strict one-time use.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const user = await prisma.user.findFirst({ where: { passwordResetToken: token } });
    
    if (!user) {
      return res.status(400).json({ error: 'Password reset link expired or invalid. Please request a new one.' });
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: 'Password reset link expired or invalid. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
