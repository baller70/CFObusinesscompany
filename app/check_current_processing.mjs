import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function checkProcessing() {
  try {
    console.log('\n📊 Checking Current Processing Status\n');
    
    // Check statements
    const statements = await prisma.bankStatement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { email: true } }
      }
    });
    
    console.log(`📄 Recent Statements: ${statements.length}`);
    for (const stmt of statements) {
      console.log(`\n  ID: ${stmt.id}`);
      console.log(`  File: ${stmt.fileName}`);
      console.log(`  User: ${stmt.user.email}`);
      console.log(`  Status: ${stmt.status}`);
      console.log(`  Stage: ${stmt.processingStage || 'N/A'}`);
      console.log(`  Record Count: ${stmt.recordCount || 0}`);
      console.log(`  File Size: ${(stmt.fileSize / 1024).toFixed(1)}KB`);
      console.log(`  Created: ${stmt.createdAt}`);
      
      if (stmt.errorLog) {
        console.log(`  Error: ${stmt.errorLog.substring(0, 200)}`);
      }
    }
    
    // Check transactions
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`\n💰 Recent Transactions: ${transactions.length}`);
    if (transactions.length > 0) {
      console.log('  Latest transactions:');
      transactions.slice(0, 5).forEach(t => {
        console.log(`    ${t.date} | ${t.description.substring(0, 40)} | $${t.amount}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProcessing();
