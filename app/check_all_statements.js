require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllStatements() {
  try {
    const statements = await prisma.bankStatement.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log('\n=== Recent Bank Statements ===');
    if (statements.length === 0) {
      console.log('No statements found in database');
    } else {
      statements.forEach((stmt, i) => {
        console.log(`\n${i+1}. ${stmt.fileName}`);
        console.log(`   Status: ${stmt.status}`);
        console.log(`   Transactions: ${stmt._count.transactions}`);
        console.log(`   Updated: ${stmt.updatedAt.toISOString()}`);
        if (stmt.processingError) {
          console.log(`   Error: ${stmt.processingError.substring(0, 100)}...`);
        }
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllStatements();
