require('dotenv').config();
const { PrismaClient } = require('/home/ubuntu/cfo_budgeting_app/app/node_modules/.prisma/client');

async function updateBudgets() {
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
    
    // Get all transactions and their date range
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' }
    });
    
    if (allTransactions.length === 0) {
      console.log('\nNo transactions found');
      return;
    }
    
    // Find unique month/year combinations
    const monthYears = new Set();
    allTransactions.forEach(txn => {
      const date = new Date(txn.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      monthYears.add(`${month}/${year}`);
    });
    
    console.log(`\nFound transactions in these months: ${Array.from(monthYears).join(', ')}\n`);
    
    // Process each month
    for (const monthYear of monthYears) {
      const [month, year] = monthYear.split('/').map(Number);
      
      console.log(`\n📅 Processing ${month}/${year}...`);
      
      // Get all transactions for this month
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      
      const monthlyTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      
      console.log(`   Found ${monthlyTransactions.length} transactions`);
      
      // Group transactions by category and calculate spending
      const categorySpending = new Map();
      
      for (const txn of monthlyTransactions) {
        const category = txn.category;
        const type = txn.type;
        
        if (!categorySpending.has(category)) {
          categorySpending.set(category, { amount: 0, type: type });
        }
        
        const current = categorySpending.get(category);
        current.amount += txn.amount;
      }
      
      console.log(`   Creating budgets for ${categorySpending.size} categories...`);
      
      // Create or update budgets for each category
      for (const [category, data] of categorySpending.entries()) {
        const spent = data.amount;
        
        // Calculate a suggested budget amount (20% more than spent, or minimum $100)
        const suggestedBudget = Math.max(spent * 1.2, 100);
        
        // Check if budget exists
        const existingBudget = await prisma.budget.findFirst({
          where: {
            userId: user.id,
            category,
            month: month,
            year: year
          }
        });
        
        if (existingBudget) {
          // Update existing budget with actual spending
          await prisma.budget.update({
            where: { id: existingBudget.id },
            data: {
              spent: spent
            }
          });
        } else {
          // Create new budget with suggested amount and actual spending
          await prisma.budget.create({
            data: {
              userId: user.id,
              category,
              month: month,
              year: year,
              amount: suggestedBudget,
              spent: spent,
              type: 'MONTHLY',
              name: `${category} - ${month}/${year}`
            }
          });
        }
      }
      
      console.log(`   ✓ Budgets updated for ${month}/${year}`);
    }
    
    console.log('\n✅ Budget update completed for all months');
    
    // Show summary for September (most recent complete month)
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month: 9,
        year: 2025
      },
      orderBy: {
        spent: 'desc'
      }
    });
    
    if (budgets.length > 0) {
      console.log(`\n📊 September 2025 Budget Summary (${budgets.length} categories):\n`);
      
      const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
      const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
      
      console.log('💸 TOP SPENDING CATEGORIES:');
      budgets.slice(0, 15).forEach(budget => {
        const percentage = (budget.spent / budget.amount * 100).toFixed(1);
        console.log(`  - ${budget.category.padEnd(30)} $${budget.spent.toFixed(2).padStart(10)} / $${budget.amount.toFixed(2).padStart(10)} (${percentage}%)`);
      });
      
      console.log(`\n  TOTAL SPENT: $${totalSpent.toFixed(2)}`);
      console.log(`  TOTAL BUDGET: $${totalBudget.toFixed(2)}`);
      
      const netAmount = totalBudget - totalSpent;
      console.log(`  REMAINING: $${netAmount.toFixed(2)}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBudgets();
