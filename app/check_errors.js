require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkErrors() {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (statements.length === 0) {
      console.log('No failed statements found.');
    } else {
      statements.forEach(stmt => {
        console.log('\n=== Failed Statement ===');
        console.log('File Name:', stmt.fileName);
        console.log('Status:', stmt.status);
        console.log('Processing Stage:', stmt.processingStage);
        console.log('Error Log:', stmt.errorLog);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

checkErrors();
