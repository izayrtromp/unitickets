const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const repPassword = await bcrypt.hash('rep123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);
  const student2Password = await bcrypt.hash('student2123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {},
    create: {
      email: 'admin@university.edu',
      name: 'System Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  const rep = await prisma.user.upsert({
    where: { email: 'rep@university.edu' },
    update: {},
    create: {
      email: 'rep@university.edu',
      name: 'Class Rep',
      passwordHash: repPassword,
      role: 'CLASS_REP',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      email: 'student@university.edu',
      name: 'John Student',
      passwordHash: studentPassword,
      role: 'STUDENT',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@university.edu' },
    update: {},
    create: {
      email: 'student2@university.edu',
      name: 'Jane Student',
      passwordHash: student2Password,
      role: 'STUDENT',
    },
  });

  console.log(`Seeding finished. created basic users.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
