const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkErrors() {
  try {
    const failedStatements = await prisma.bankStatement.findMany({
      where: {
        status: 'FAILED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('===== FAILED STATEMENTS =====');
    failedStatements.forEach(stmt => {
      console.log(`\nFile: ${stmt.fileName}`);
      console.log(`Status: ${stmt.status}`);
      console.log(`Processing Stage: ${stmt.processingStage}`);
      console.log(`Error Log: ${stmt.errorLog}`);
      console.log(`Created: ${stmt.createdAt}`);
    });
    
    if (failedStatements.length === 0) {
      console.log('\nNo failed statements found. Checking all statements:');
      const allStatements = await prisma.bankStatement.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });
      allStatements.forEach(stmt => {
        console.log(`\nFile: ${stmt.fileName}`);
        console.log(`Status: ${stmt.status}`);
        console.log(`Processing Stage: ${stmt.processingStage}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkErrors();
