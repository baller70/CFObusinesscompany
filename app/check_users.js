const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyName: true
      }
    });

    console.log('=== ALL USERS ===');
    users.forEach(u => {
      console.log(`\nEmail: ${u.email}`);
      console.log(`Name: ${u.firstName} ${u.lastName}`);
      console.log(`Company: ${u.companyName}`);
      console.log(`ID: ${u.id}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
