const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true, approvalStatus: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get staff users for assignment dropdown
router.get('/staff', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['CLASS_REP', 'ADMIN'] }, isActive: true },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const validRoles = ['STUDENT', 'CLASS_REP', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    if (role === 'STUDENT' && !studentId) {
      return res.status(400).json({ error: 'Student ID is required for students' });
    }

    if (studentId) {
      const existingStudentId = await prisma.user.findUnique({ where: { studentId: studentId.trim() } });
      if (existingStudentId) {
        return res.status(409).json({ error: 'Student ID already exists' });
      }
    }
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.trim(), studentId: studentId ? studentId.trim() : null, passwordHash, role },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true, createdAt: true }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user role (Admin only)
router.patch('/:id/role', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    
    const validRoles = ['STUDENT', 'CLASS_REP', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (req.params.id === req.user.id && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot remove your own ADMIN role' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'ADMIN' && targetUser.isActive && role !== 'ADMIN') {
      const activeAdminsCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true }
      });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({ error: 'You cannot downgrade the last active admin' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true, createdAt: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Reset user password (Admin only)
router.patch('/:id/password', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash }
    });
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Deactivate user (Admin only)
router.patch('/:id/deactivate', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'ADMIN' && targetUser.isActive) {
      const activeAdminsCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true }
      });
      if (activeAdminsCount <= 1) {
        return res.status(400).json({ error: 'You cannot deactivate the last active admin' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// Reactivate user (Admin only)
router.patch('/:id/reactivate', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reactivate user' });
  }
});

// Approve user (Admin only)
router.patch('/:id/approve', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'APPROVED', isActive: true },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true, approvalStatus: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user (Admin only)
router.patch('/:id/reject', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { approvalStatus: 'REJECTED', isActive: false },
      select: { id: true, name: true, email: true, studentId: true, role: true, isActive: true, approvalStatus: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

module.exports = router;
