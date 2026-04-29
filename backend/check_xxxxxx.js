const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Total users:", users.length);
  users.forEach(u => {
    if (u.studentId === "xxxxxx" || (u.email && u.email.includes("ua.aw"))) {
      console.log(`id: ${u.id}, email: ${u.email}, studentId: ${u.studentId}, isEmailVerified: ${u.isEmailVerified}, isActive: ${u.isActive}, role: ${u.role}`);
    }
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
