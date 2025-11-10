const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkStatement() {
  const statement = await prisma.bankStatement.findFirst({
    where: {
      fileName: {
        contains: 'Jan 2024'
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (statement) {
    console.log('Recent statement:');
    console.log('- File:', statement.fileName);
    console.log('- Status:', statement.status);
    console.log('- Stage:', statement.processingStage);
    console.log('- Record Count:', statement.recordCount);
    console.log('- Created:', statement.createdAt);
    console.log('- Updated:', statement.updatedAt);
    
    const transactions = await prisma.transaction.count({
      where: {
        bankStatementId: statement.id
      }
    });
    console.log('- Transactions in DB:', transactions);
  } else {
    console.log('No statement found');
  }
  
  await prisma.$disconnect();
}

checkStatement();
