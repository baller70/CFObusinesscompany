require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('\n=== DATABASE STATE ===\n');
    
    // Check bank statements
    const statements = await prisma.bankStatement.findMany({
      include: {
        businessProfile: true
      }
    });
    console.log(`Bank Statements: ${statements.length}`);
    statements.forEach(s => {
      console.log(`  - ${s.fileName}: ${s.status}, ${s.transactionCount} transactions`);
    });
    
    // Check transactions
    const transactions = await prisma.transaction.findMany();
    console.log(`\nTransactions: ${transactions.length}`);
    
    // Group by category
    const byCategory = {};
    transactions.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });
    console.log('\nTransactions by category:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
    
    // Check budgets
    const budgets = await prisma.budget.findMany({
      include: {
        businessProfile: true
      }
    });
    console.log(`\nBudgets: ${budgets.length}`);
    budgets.forEach(b => {
      console.log(`  - ${b.category}: $${b.allocated}, spent: $${b.spent}`);
    });
    
    // Check recurring charges
    const recurring = await prisma.recurringCharge.findMany();
    console.log(`\nRecurring Charges: ${recurring.length}`);
    recurring.forEach(r => {
      console.log(`  - ${r.name}: $${r.amount}, ${r.frequency}`);
    });
    
    // Sum totals
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    console.log(`\n=== TOTALS ===`);
    console.log(`Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${totalExpense.toFixed(2)}`);
    console.log(`Net: $${(totalIncome - totalExpense).toFixed(2)}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
