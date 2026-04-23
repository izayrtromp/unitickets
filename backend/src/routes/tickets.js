const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();
const prisma = new PrismaClient();

// Get all tickets (filtered by role)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category, priority, search, quickFilter } = req.query;

    const where = {};
    if (req.user.role === 'STUDENT') {
      where.submitterId = req.user.id;
    }

    if (status) {
      where.status = status;
    } else if (quickFilter === 'open') {
      where.status = { not: 'CLOSED' };
    } else if (quickFilter === 'closed') {
      where.status = 'CLOSED';
    }
    if (category) where.category = category;
    if (priority) where.priority = priority;
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get single ticket
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        comments: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    if (req.user.role === 'STUDENT') {
      if (ticket.submitterId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user.role !== 'CLASS_REP' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Create ticket (Students, Reps, Admins)
router.post('/', authenticateToken, authorizeRoles('STUDENT', 'CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const { title, category, description, priority } = req.body;
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        category,
        description,
        priority: priority || 'MEDIUM',
        status: 'NEW',
        submitterId: req.user.id
      }
    });
    
    await prisma.activity.create({
      data: {
        ticketId: newTicket.id,
        userId: req.user.id,
        action: 'created ticket'
      }
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket status or assignment
router.put('/:id', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const { status, assignedToId } = req.body;
    let data = {};
    if (status) data.status = status;
    if (assignedToId !== undefined) data.assignedToId = assignedToId; // null is allowed

    // Fetch previous state to compare
    const oldTicket = await prisma.ticket.findUnique({
      where: { id: req.params.id }
    });

    if (!oldTicket) return res.status(404).json({ error: 'Ticket not found' });

    if (assignedToId) {
      const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!targetUser || !['CLASS_REP', 'ADMIN'].includes(targetUser.role)) {
        return res.status(400).json({ error: 'Invalid user for assignment' });
      }
    }

    if (status && status !== oldTicket.status) {
      const allowedTransitions = {
        'NEW': ['IN_PROGRESS'],
        'IN_PROGRESS': ['WAITING', 'RESOLVED'],
        'WAITING': ['RESOLVED'],
        'RESOLVED': ['CLOSED'],
        'CLOSED': ['IN_PROGRESS']
      };
      
      const validNextStatuses = allowedTransitions[oldTicket.status] || [];
      if (!validNextStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status transition from ${oldTicket.status} to ${status}` });
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data,
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } }
      }
    });

    if (status && status !== oldTicket.status) {
      let actionText = `changed status to ${status}`;
      if (oldTicket.status === 'CLOSED' && status === 'IN_PROGRESS') {
        actionText = 'reopened ticket';
      }

      await prisma.activity.create({
        data: {
          ticketId: ticket.id,
          userId: req.user.id,
          action: actionText
        }
      });
    }

    if (assignedToId !== undefined && assignedToId !== oldTicket.assignedToId) {
      let actionText = '';
      if (!oldTicket.assignedToId && assignedToId) {
        actionText = `assigned ticket to ${ticket.assignedTo.name}`;
      } else if (oldTicket.assignedToId && assignedToId) {
        actionText = `reassigned ticket to ${ticket.assignedTo.name}`;
      } else if (oldTicket.assignedToId && !assignedToId) {
        actionText = `unassigned ticket`;
      }
      
      if (actionText) {
        await prisma.activity.create({
          data: {
            ticketId: ticket.id,
            userId: req.user.id,
            action: actionText
          }
        });
      }
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Delete associated comments first
    await prisma.comment.deleteMany({ where: { ticketId: req.params.id } });
    await prisma.ticket.delete({ where: { id: req.params.id } });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;
