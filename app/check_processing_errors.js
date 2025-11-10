require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkErrors() {
  try {
    const statements = await prisma.bankStatement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: {
        fileName: true,
        status: true,
        processingStage: true,
        errorLog: true,
        recordCount: true,
        processedCount: true,
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log('Bank Statement Processing Status:');
    console.log('='.repeat(80));
    
    for (const stmt of statements) {
      console.log(`\nFile: ${stmt.fileName}`);
      console.log(`Status: ${stmt.status}`);
      console.log(`Processing Stage: ${stmt.processingStage}`);
      console.log(`Record Count: ${stmt.recordCount}`);
      console.log(`Processed Count: ${stmt.processedCount}`);
      console.log(`Actual Transactions in DB: ${stmt._count.transactions}`);
      
      if (stmt.errorLog) {
        console.log(`\nError Log:`);
        console.log(stmt.errorLog);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkErrors();
