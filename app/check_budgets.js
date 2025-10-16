const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBudgets() {
  try {
    console.log('Checking database for budgets...\n');
    
    const budgets = await prisma.budget.findMany({
      include: {
        businessProfile: {
          select: { name: true }
        }
      },
      orderBy: { category: 'asc' }
    });
    
    console.log(`✅ Total budgets: ${budgets.length}\n`);
    
    if (budgets.length > 0) {
      budgets.forEach(budget => {
        console.log(`Budget: ${budget.category}`);
        console.log(`  Profile: ${budget.businessProfile?.name || 'No Profile'}`);
        console.log(`  Amount: $${budget.amount.toFixed(2)}`);
        console.log(`  Spent: $${budget.spent.toFixed(2)}`);
        console.log(`  Month/Year: ${budget.month}/${budget.year}`);
        console.log(`  Type: ${budget.type}`);
        console.log('---');
      });
    } else {
      console.log('❌ NO BUDGETS FOUND IN DATABASE!');
    }
    
    // Check transactions
    const transactionCount = await prisma.transaction.count();
    console.log(`\n✅ Total transactions: ${transactionCount}`);
    
    // Check if transactions have categories
    const categorizedTransactions = await prisma.transaction.count({
      where: {
        category: {
          not: ''
        }
      }
    });
    console.log(`✅ Categorized transactions: ${categorizedTransactions}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBudgets();
