const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "lecturer@ua.aw";
  const studentId = "12345678";
  
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { studentId }
      ]
    }
  });

  console.log("Found:", existingUser);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
