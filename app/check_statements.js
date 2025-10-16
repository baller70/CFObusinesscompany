require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStatements() {
  try {
    console.log('\n=== Checking Bank Statements ===\n');
    
    const statements = await prisma.bankStatement.findMany({
      include: {
        transactions: {
          select: { id: true, amount: true, category: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    for (const stmt of statements) {
      console.log(`\n📄 Statement: ${stmt.originalName || stmt.fileName}`);
      console.log(`   ID: ${stmt.id}`);
      console.log(`   Status: ${stmt.status}`);
      console.log(`   Processing Stage: ${stmt.processingStage}`);
      console.log(`   Transactions: ${stmt.transactions.length}`);
      console.log(`   Created: ${stmt.createdAt}`);
      if (stmt.errorLog) {
        console.log(`   Error: ${stmt.errorLog.substring(0, 100)}...`);
      }
    }

    console.log(`\n\nTotal statements: ${statements.length}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatements();
