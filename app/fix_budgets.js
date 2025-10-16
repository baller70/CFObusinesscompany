const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBudgets() {
  try {
    console.log('Starting budget businessProfileId fix...\n');
    
    // Get all budgets without a businessProfileId
    const budgetsWithoutProfile = await prisma.budget.findMany({
      where: {
        businessProfileId: null
      }
    });
    
    console.log(`Found ${budgetsWithoutProfile.length} budgets without businessProfileId`);
    
    // For each budget, find a transaction with the same category/month/year to get the businessProfileId
    let fixed = 0;
    for (const budget of budgetsWithoutProfile) {
      // Find a transaction that matches this budget
      const transaction = await prisma.transaction.findFirst({
        where: {
          userId: budget.userId,
          category: budget.category,
          date: {
            gte: new Date(budget.year, budget.month - 1, 1),
            lte: new Date(budget.year, budget.month, 0, 23, 59, 59)
          }
        }
      });
      
      if (transaction && transaction.businessProfileId) {
        // Update the budget with the businessProfileId from the transaction
        await prisma.budget.update({
          where: { id: budget.id },
          data: { businessProfileId: transaction.businessProfileId }
        });
        console.log(`✓ Fixed budget: ${budget.category} (${budget.month}/${budget.year}) -> ${transaction.businessProfileId}`);
        fixed++;
      } else {
        console.log(`✗ Could not find matching transaction for: ${budget.category} (${budget.month}/${budget.year})`);
      }
    }
    
    console.log(`\nFixed ${fixed} out of ${budgetsWithoutProfile.length} budgets`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixBudgets();
