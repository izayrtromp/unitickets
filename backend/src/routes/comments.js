const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router({ mergeParams: true });
const prisma = new PrismaClient();

// Add comment to ticket
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { content } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role === 'STUDENT') {
      if (ticket.submitterId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user.role !== 'CLASS_REP' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId,
        userId: req.user.id
      },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    await prisma.activity.create({
      data: {
        ticketId,
        userId: req.user.id,
        action: 'added a comment'
      }
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
