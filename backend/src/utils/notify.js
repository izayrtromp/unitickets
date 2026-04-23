const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createNotification = async ({ userId, ticketId, type, message, commentId, activityId, targetSection }) => {
  const tenSecondsAgo = new Date(Date.now() - 10000);
  
  const recent = await prisma.notification.findFirst({
    where: {
      userId,
      ticketId,
      type,
      createdAt: { gte: tenSecondsAgo }
    }
  });

  if (!recent) {
    await prisma.notification.create({
      data: { userId, ticketId, type, message, commentId, activityId, targetSection }
    });
  }
};

module.exports = { createNotification };
