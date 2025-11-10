const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function clearStatements() {
  // Delete all Jan 2024 statements
  const deleted = await prisma.bankStatement.deleteMany({
    where: {
      fileName: {
        contains: 'Jan 2024'
      }
    }
  });
  
  console.log(`Deleted ${deleted.count} Jan 2024 statements`);
  await prisma.$disconnect();
}

clearStatements();
