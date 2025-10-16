const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserData() {
  try {
    // Find the actual user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`User: ${user.email}\n`);
    
    // Check transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        date: true,
        description: true,
        amount: true,
        source: true,
        bankStatementId: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log(`Total transactions: ${await prisma.transaction.count({ where: { userId: user.id } })}`);
    console.log(`\nSample transactions:`);
    transactions.forEach(t => {
      console.log(`  ${t.date.toISOString().split('T')[0]} - ${t.description} - $${t.amount} - Source: ${t.source || 'manual'} - StatementId: ${t.bankStatementId ? 'Yes' : 'No'}`);
    });
    
    // Check bank statements
    const statements = await prisma.bankStatement.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        fileName: true,
        status: true,
        uploadedAt: true,
        processedAt: true,
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log(`\n\nTotal bank statements: ${statements.length}`);
    statements.forEach(s => {
      console.log(`  ${s.fileName} - Status: ${s.status} - Transactions: ${s._count.transactions}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();
