const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// List of seed accounts or important admin accounts to preserve
const KEEP_EMAILS = [
  "admin@university.edu",
  "student@university.edu",
  "classrep@university.edu"
];

async function main() {
  console.log('Starting cleanup of test data...\n');

  try {
    // 1. Delete Meeting Agenda Items
    const deleteAgendaItems = await prisma.meetingAgendaItem.deleteMany();
    console.log(`- Deleted ${deleteAgendaItems.count} meeting agenda items`);

    // 2. Delete Meetings
    const deleteMeetings = await prisma.meeting.deleteMany();
    console.log(`- Deleted ${deleteMeetings.count} meetings`);

    // 3. Delete Tasks
    const deleteTasks = await prisma.task.deleteMany();
    console.log(`- Deleted ${deleteTasks.count} tasks`);

    // 4. Delete Notifications
    const deleteNotifications = await prisma.notification.deleteMany();
    console.log(`- Deleted ${deleteNotifications.count} notifications`);

    // 5. Delete Activities
    const deleteActivities = await prisma.activity.deleteMany();
    console.log(`- Deleted ${deleteActivities.count} activities`);

    // 6. Delete Comments
    const deleteComments = await prisma.comment.deleteMany();
    console.log(`- Deleted ${deleteComments.count} comments`);

    // 7. Delete Tickets
    const deleteTickets = await prisma.ticket.deleteMany();
    console.log(`- Deleted ${deleteTickets.count} tickets`);

    // 8. Delete Users (except those in KEEP_EMAILS)
    const deleteUsers = await prisma.user.deleteMany({
      where: {
        email: {
          notIn: KEEP_EMAILS
        }
      }
    });
    console.log(`- Deleted ${deleteUsers.count} test/pending users`);

    // Fetch and display preserved users
    const preservedUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        approvalStatus: true
      },
      orderBy: {
        role: 'asc'
      }
    });

    console.log('\nPreserved Users:');
    preservedUsers.forEach(user => {
      console.log(`  > ${user.email} | Role: ${user.role} | Status: ${user.approvalStatus}`);
    });

    console.log('\n✅ Cleanup complete. Database is ready for clean testing.');

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
main();
