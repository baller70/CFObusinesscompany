const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJohnData() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    if (!user) {
      console.log('User john@doe.com not found');
      return;
    }
    
    // Check transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        date: true,
        description: true,
        amount: true,
        bankStatementId: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`Total transactions: ${await prisma.transaction.count({ where: { userId: user.id } })}`);
    console.log(`\nSample transactions:`);
    transactions.forEach(t => {
      console.log(`  ${t.date.toISOString().split('T')[0]} - ${t.description} - $${t.amount} - From Statement: ${t.bankStatementId ? 'Yes' : 'No'}`);
    });
    
    // Count transactions from statements vs manual
    const fromStatements = await prisma.transaction.count({
      where: { 
        userId: user.id,
        bankStatementId: { not: null }
      }
    });
    
    const manualTransactions = await prisma.transaction.count({
      where: { 
        userId: user.id,
        bankStatementId: null
      }
    });
    
    console.log(`\nFrom bank statements: ${fromStatements}`);
    console.log(`Manual/Seed transactions: ${manualTransactions}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJohnData();
