const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentProcessing() {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: {
        userId: {
          in: await prisma.user.findMany({
            select: { id: true }
          }).then(users => users.map(u => u.id))
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log('\n📊 Recent Bank Statement Processing Status:\n');
    
    statements.forEach((stmt, idx) => {
      console.log(`\n${idx + 1}. Statement ID: ${stmt.id}`);
      console.log(`   File: ${stmt.fileName}`);
      console.log(`   User: ${stmt.user.email}`);
      console.log(`   Status: ${stmt.processingStatus}`);
      console.log(`   Stage: ${stmt.processingStage || 'N/A'}`);
      console.log(`   Transactions: ${stmt.transactionCount || 0}`);
      console.log(`   Created: ${stmt.createdAt}`);
      if (stmt.errorLog) {
        console.log(`   Error: ${stmt.errorLog.substring(0, 100)}...`);
      }
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkCurrentProcessing();
