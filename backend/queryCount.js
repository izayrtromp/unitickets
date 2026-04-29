const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.count();
  console.log("Total users in DB:", count);
  const users = await prisma.user.findMany();
  console.log(users.map(u => u.email));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
