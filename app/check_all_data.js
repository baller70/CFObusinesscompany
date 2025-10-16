const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllData() {
  console.log('\n=== CHECKING ALL DATABASE DATA ===\n');
  
  try {
    // Check users
    const users = await prisma.user.findMany();
    console.log('Users:', users.length);
    
    // Check business profiles
    const profiles = await prisma.businessProfile.findMany();
    console.log('Business Profiles:', profiles.length);
    if (profiles.length > 0) {
      console.log('  Profile IDs:', profiles.map(p => p.id));
    }
    
    // Check bank statements
    const statements = await prisma.bankStatement.findMany({
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    console.log('\nBank Statements:', statements.length);
    statements.forEach(s => {
      console.log(`  - ${s.fileName} (${s.status}) - ${s._count.transactions} transactions`);
    });
    
    // Check transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        businessProfile: true
      }
    });
    console.log('\nTransactions:', transactions.length);
    
    if (transactions.length > 0) {
      console.log('\nTransaction Summary by Profile:');
      const byProfile = {};
      transactions.forEach(t => {
        const profileName = t.businessProfile?.name || 'No Profile';
        if (!byProfile[profileName]) {
          byProfile[profileName] = { count: 0, total: 0 };
        }
        byProfile[profileName].count++;
        byProfile[profileName].total += t.amount;
      });
      
      Object.entries(byProfile).forEach(([name, data]) => {
        console.log(`  ${name}: ${data.count} transactions, Total: $${data.total.toFixed(2)}`);
      });
      
      console.log('\nTransaction Summary by Category:');
      const byCategory = {};
      transactions.forEach(t => {
        if (!byCategory[t.category]) {
          byCategory[t.category] = { count: 0, total: 0 };
        }
        byCategory[t.category].count++;
        byCategory[t.category].total += t.amount;
      });
      
      Object.entries(byCategory).forEach(([cat, data]) => {
        console.log(`  ${cat}: ${data.count} transactions, Total: $${data.total.toFixed(2)}`);
      });
    }
    
    // Check budgets
    const budgets = await prisma.budget.findMany({
      include: {
        businessProfile: true
      }
    });
    console.log('\nBudgets:', budgets.length);
    budgets.forEach(b => {
      console.log(`  - ${b.category}: $${b.allocated} allocated, $${b.spent} spent (${b.businessProfile?.name || 'No Profile'})`);
    });
    
    // Check revenue records
    const revenues = await prisma.revenue.findMany();
    console.log('\nRevenue Records:', revenues.length);
    
    // Check expense records
    const expenses = await prisma.expense.findMany();
    console.log('\nExpense Records:', expenses.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
