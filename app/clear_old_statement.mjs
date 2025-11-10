import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function clearStatement() {
  try {
    console.log('\n🧹 Clearing old statement data...\n');
    
    // Delete all transactions
    const deletedTxns = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTxns.count} transactions`);
    
    // Delete all statements
    const deletedStmts = await prisma.bankStatement.deleteMany({});
    console.log(`✅ Deleted ${deletedStmts.count} statements`);
    
    console.log('\n✅ Ready for fresh upload test!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearStatement();
