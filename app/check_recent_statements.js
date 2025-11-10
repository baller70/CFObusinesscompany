require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatements() {
  const statements = await prisma.bankStatement.findMany({
    where: {
      user: {
        email: 'khouston@thebasketballfactorynj.com'
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: true
    }
  });
  
  console.log('=== RECENT STATEMENT UPLOADS ===\n');
  statements.forEach(stmt => {
    console.log(`File: ${stmt.fileName}`);
    console.log(`Status: ${stmt.status}`);
    console.log(`Transactions: ${stmt.transactionCount}`);
    console.log(`Error: ${stmt.error || 'None'}`);
    console.log(`Upload: ${stmt.createdAt}`);
    console.log('---\n');
  });
  
  await prisma.$disconnect();
}

checkStatements().catch(console.error);
