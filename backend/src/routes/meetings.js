const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { createNotification } = require('../utils/notify');

const router = express.Router();
const prisma = new PrismaClient();

// Get all meetings (CLASS_REP, ADMIN)
router.get('/', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      orderBy: { meetingDate: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        agendaItems: { select: { status: true } },
      },
    });
    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting details (CLASS_REP, ADMIN)
router.get('/:id', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        agendaItems: {
          include: {
            addedBy: { select: { id: true, name: true } },
            ticket: {
              include: {
                submitter: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } },
                tasks: { select: { id: true, title: true, status: true, assignedTo: { select: { name: true } } } }
              }
            }
          }
        }
      }
    });

    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch meeting details' });
  }
});

// Create a new meeting (CLASS_REP, ADMIN)
router.post('/', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  const { title, meetingDate, location, notes } = req.body;
  if (!title || !meetingDate) return res.status(400).json({ error: 'Title and meeting date are required' });

  const dateObj = new Date(meetingDate);
  if (isNaN(dateObj.getTime())) return res.status(400).json({ error: 'Invalid meeting date' });

  try {
    const meeting = await prisma.meeting.create({
      data: {
        title,
        meetingDate: dateObj,
        location,
        notes,
        createdById: req.user.id
      }
    });
    res.status(201).json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update a meeting (CLASS_REP, ADMIN)
router.patch('/:id', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  const { title, meetingDate, location, notes } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (location !== undefined) data.location = location;
  if (notes !== undefined) data.notes = notes;
  if (meetingDate !== undefined) {
    const dateObj = new Date(meetingDate);
    if (isNaN(dateObj.getTime())) return res.status(400).json({ error: 'Invalid meeting date' });
    data.meetingDate = dateObj;
  }

  try {
    const meeting = await prisma.meeting.update({
      where: { id: req.params.id },
      data
    });
    res.json(meeting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete a meeting (ADMIN ONLY)
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    await prisma.meeting.delete({ where: { id: req.params.id } });
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Add ticket to meeting agenda
router.post('/:id/agenda', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  const { ticketId } = req.body;
  const meetingId = req.params.id;

  if (!ticketId) return res.status(400).json({ error: 'Ticket ID is required' });

  try {
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Check if meeting exists
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Check for duplicate
    const existingItem = await prisma.meetingAgendaItem.findUnique({
      where: { meetingId_ticketId: { meetingId, ticketId } }
    });
    if (existingItem) return res.status(409).json({ error: 'Ticket is already on the agenda for this meeting' });

    const agendaItem = await prisma.meetingAgendaItem.create({
      data: {
        meetingId,
        ticketId,
        status: 'PENDING',
        addedById: req.user.id
      },
      include: { ticket: true }
    });

    // Notify ticket submitter
    await createNotification({
      userId: ticket.submitterId,
      message: `Your ticket '${ticket.title}' was added to a class rep meeting agenda`,
      type: 'MEETING_AGENDA_ADDED',
      ticketId: ticket.id,
      targetSection: 'details'
    });

    res.status(201).json(agendaItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add ticket to agenda' });
  }
});

// Update agenda item
router.patch('/:meetingId/agenda/:itemId', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  const { discussionNotes, outcome, status } = req.body;
  const validStatuses = ['PENDING', 'DISCUSSED', 'FOLLOW_UP_REQUIRED', 'RESOLVED', 'ESCALATED'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid agenda item status' });
  }

  const data = {};
  if (discussionNotes !== undefined) data.discussionNotes = discussionNotes;
  if (outcome !== undefined) data.outcome = outcome;
  if (status !== undefined) data.status = status;

  try {
    // Fetch old item to check if status changed
    const oldItem = await prisma.meetingAgendaItem.findUnique({
      where: { id: req.params.itemId },
      include: { ticket: true }
    });

    if (!oldItem) return res.status(404).json({ error: 'Agenda item not found' });

    const updatedItem = await prisma.meetingAgendaItem.update({
      where: { id: req.params.itemId },
      data
    });

    if (status && status !== oldItem.status && ['DISCUSSED', 'FOLLOW_UP_REQUIRED', 'RESOLVED'].includes(status)) {
      await createNotification({
        userId: oldItem.ticket.submitterId,
        message: `Your ticket '${oldItem.ticket.title}' was discussed in a class rep meeting`,
        type: 'MEETING_DISCUSSED',
        ticketId: oldItem.ticket.id,
        targetSection: 'details'
      });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update agenda item' });
  }
});

// Remove agenda item
router.delete('/:meetingId/agenda/:itemId', authenticateToken, authorizeRoles('CLASS_REP', 'ADMIN'), async (req, res) => {
  try {
    await prisma.meetingAgendaItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Agenda item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove agenda item' });
  }
});

module.exports = router;
