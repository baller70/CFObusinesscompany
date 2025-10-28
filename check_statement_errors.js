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

    console.log('Failed Statements:', JSON.stringify(failedStatements, null, 2));
    
    if (failedStatements.length === 0) {
      console.log('\nNo failed statements found. Checking all statements:');
      const allStatements = await prisma.bankStatement.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });
      console.log('All Recent Statements:', JSON.stringify(allStatements, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkErrors();
