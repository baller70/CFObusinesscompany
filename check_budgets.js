const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBudgets() {
  try {
    console.log('Checking database for budgets...\n');
    
    // Check budgets
    const budgets = await prisma.budget.findMany({
      include: {
        businessProfile: {
          select: { name: true }
        },
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log(`Total budgets: ${budgets.length}\n`);
    
    if (budgets.length > 0) {
      budgets.forEach(budget => {
        console.log(`Budget: ${budget.category}`);
        console.log(`  Profile: ${budget.businessProfile.name}`);
        console.log(`  Amount: $${budget.amount}`);
        console.log(`  Spent: $${budget.spent}`);
        console.log(`  Period: ${budget.period}`);
        console.log(`  Transactions: ${budget._count.transactions}`);
        console.log('---');
      });
    }
    
    // Check transactions
    const transactions = await prisma.transaction.findMany({
      take: 5,
      orderBy: { date: 'desc' }
    });
    
    console.log(`\nTotal transactions: ${await prisma.transaction.count()}`);
    console.log('\nSample transactions:');
    transactions.forEach(t => {
      console.log(`  ${t.description}: $${t.amount} - Category: ${t.category}, Budget: ${t.budgetId}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBudgets();
