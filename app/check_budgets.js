require('dotenv').config();
const { PrismaClient } = require('/home/ubuntu/cfo_budgeting_app/app/node_modules/.prisma/client');

async function checkBudgets() {
  const prisma = new PrismaClient();
  
  try {
    // Get user
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User ID:', user.id);
    
    // Get budgets
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id }
    });
    
    console.log('\nBudgets:', budgets.length);
    budgets.forEach(budget => {
      console.log(`- ${budget.category}: $${budget.amount} budget, $${budget.spent} spent`);
    });
    
    // Get categories
    const categories = await prisma.category.findMany({
      where: { userId: user.id }
    });
    
    console.log('\nCategories:', categories.length);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.type}): budget=${cat.budget || 'none'}`);
    });
    
    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { categoryRelation: true },
      orderBy: { date: 'desc' },
      take: 10
    });
    
    console.log('\nRecent Transactions:', transactions.length);
    transactions.forEach(txn => {
      console.log(`- ${txn.date.toISOString().split('T')[0]}: ${txn.description} = $${txn.amount} (${txn.category})`);
    });
    
    // Get transactions by category
    const txnsByCategory = await prisma.transaction.groupBy({
      by: ['category'],
      where: { userId: user.id, type: 'EXPENSE' },
      _sum: { amount: true },
      _count: { id: true }
    });
    
    console.log('\nExpenses by Category:');
    txnsByCategory.forEach(group => {
      console.log(`- ${group.category}: $${group._sum.amount} (${group._count.id} transactions)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBudgets();
