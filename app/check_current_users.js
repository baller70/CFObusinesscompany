require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    console.log('\n📋 Current Users:\n');
    users.forEach(user => {
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name || 'N/A'}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log('  ─────────────────────');
    });

    console.log(`\n✅ Total users: ${users.length}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
