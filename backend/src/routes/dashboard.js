const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    let baseWhere = {};
    if (req.user.role === 'STUDENT') {
      baseWhere.submitterId = req.user.id;
    } else if (req.user.role !== 'CLASS_REP' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const totalTickets = await prisma.ticket.count({ where: baseWhere });
    const newTickets = await prisma.ticket.count({ where: { ...baseWhere, status: 'NEW' } });
    const inProgress = await prisma.ticket.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } });
    const resolved = await prisma.ticket.count({ where: { ...baseWhere, status: 'RESOLVED' } });
    const highPriority = await prisma.ticket.count({ where: { ...baseWhere, priority: { in: ['HIGH', 'URGENT'] } } });
    const feedbackCount = await prisma.ticket.count({ where: { ...baseWhere, category: 'Feedback' } });

    res.json({
      totalTickets,
      newTickets,
      inProgress,
      resolved,
      highPriority,
      feedbackCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
