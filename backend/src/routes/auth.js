const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/email');
const { isValidUAEmail } = require('../utils/validation');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

const resendCooldowns = new Map(); // in-memory cache for rate-limiting

router.post('/register-request', async (req, res) => {
  try {
    const { name, studentId, email, password, confirmPassword } = req.body;

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
        verificationToken
      }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const emailSent = await sendVerificationEmail(email, verificationUrl);

    if (!emailSent) {
      await prisma.user.delete({ where: { email } });
      return res.status(500).json({ error: 'Failed to send verification email. Please try registering again later.' });
    }

    const responsePayload = {
      message: 'Account request submitted. Please check your University of Aruba email to verify your account.'
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
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

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Omit password hash in response
    const { passwordHash, ...userData } = user;
    
    res.json({ token, user: userData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        approvalStatus: 'APPROVED',
        isActive: true,
        verificationToken: null
      }
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!isValidUAEmail(email)) {
      return res.status(400).json({ error: 'Please use your University of Aruba email address (@ua.aw).' });
    }

    const genericSuccess = 'If an unverified account exists, a new verification email has been sent.';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: genericSuccess });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: 'This account is already verified.' });
    }

    const now = Date.now();
    const lastSent = resendCooldowns.get(email);
    if (lastSent && (now - lastSent) < 2 * 60 * 1000) {
      return res.status(429).json({ error: 'Please wait before requesting another verification email.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const emailSent = await sendVerificationEmail(email, verificationUrl);
    if (emailSent) {
      resendCooldowns.set(email, now);
    }

    res.json({ message: genericSuccess });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
