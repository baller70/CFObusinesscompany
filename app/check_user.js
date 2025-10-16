const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAndStatements() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });
    
    console.log('\n=== USER INFO ===');
    if (user) {
      console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name
      });
    } else {
      console.log('User NOT found');
    }

    if (user) {
      const statements = await prisma.bankStatement.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n=== BANK STATEMENTS ===');
      console.log(`Found ${statements.length} statements:`);
      statements.forEach((stmt, idx) => {
        console.log(`\n${idx + 1}. ${stmt.fileName}`);
        console.log(`   Status: ${stmt.status}`);
        console.log(`   Processing Stage: ${stmt.processingStage}`);
        console.log(`   Account: ${stmt.accountNumber || 'N/A'}`);
        console.log(`   Transaction Count: ${stmt.transactionCount}`);
        console.log(`   Error: ${stmt.errorLog || 'None'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndStatements();
