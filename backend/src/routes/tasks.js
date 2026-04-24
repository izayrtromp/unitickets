const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');
const router = express.Router();
const prisma = new PrismaClient();

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

// GET /tasks
router.get('/', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const { status, assignedToId, ticketId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    if (ticketId) where.ticketId = ticketId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        ticket: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks
router.post('/', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, status, dueDate, ticketId, assignedToId } = req.body;

    if (!title || !assignedToId) {
      return res.status(400).json({ error: 'Title and assigned user are required' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }

    if (dueDate && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: 'Invalid due date' });
    }

    const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
    if (!assignee || !['CLASS_REP', 'ADMIN'].includes(assignee.role) || !assignee.isActive) {
      return res.status(400).json({ error: 'Invalid user for assignment' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
        ticketId: ticketId || null,
        assignedToId,
        createdById: req.user.id
      },
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    if (assignedToId !== req.user.id) {
      await createNotification({
        userId: assignedToId,
        type: 'ASSIGNED',
        message: `You were assigned task: ${title}`,
        ticketId: ticketId || undefined,
        targetSection: 'tasks'
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id
router.patch('/:id', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, status, dueDate, assignedToId } = req.body;
    
    const existingTask = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }

    if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: 'Invalid due date' });
    }

    if (assignedToId && assignedToId !== existingTask.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!assignee || !['CLASS_REP', 'ADMIN'].includes(assignee.role) || !assignee.isActive) {
        return res.status(400).json({ error: 'Invalid user for assignment' });
      }
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        ticket: { select: { id: true, title: true } }
      }
    });

    if (assignedToId && assignedToId !== existingTask.assignedToId && assignedToId !== req.user.id) {
      await createNotification({
        userId: assignedToId,
        type: 'ASSIGNED',
        message: `You were assigned task: ${task.title}`,
        ticketId: task.ticketId || undefined,
        targetSection: 'tasks'
      });
    }

    if (status === 'DONE' && existingTask.status !== 'DONE' && task.createdById !== req.user.id) {
      await createNotification({
        userId: task.createdById,
        type: 'STATUS',
        message: `Task completed: ${task.title}`,
        ticketId: task.ticketId || undefined,
        targetSection: 'tasks'
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
