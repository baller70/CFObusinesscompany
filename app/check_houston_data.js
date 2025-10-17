const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDashboardData() {
  try {
    // Get the user
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('=== USER INFO ===');
    console.log(`User ID: ${user.id}`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Company: ${user.companyName}`);
    
    // Get business profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id, isActive: true }
    });
    
    console.log('\n=== BUSINESS PROFILES ===');
    profiles.forEach(p => {
      console.log(`Profile: ${p.name} (ID: ${p.id})`);
      console.log(`  Type: ${p.type}`);
      console.log(`  Is Current: ${p.isCurrent}`);
    });

    const currentProfile = profiles.find(p => p.isCurrent);
    const businessProfileId = currentProfile?.id;
    
    console.log(`\nUsing Profile: ${currentProfile ? currentProfile.name : 'ALL PROFILES'}`);

    // Get current date and month range
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    console.log(`\n=== DATE RANGE (Current Month) ===`);
    console.log(`Month: ${currentMonth + 1}/${currentYear}`);
    console.log(`From: ${firstDayOfMonth.toISOString()}`);
    console.log(`To: ${lastDayOfMonth.toISOString()}`);

    // Get all transactions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        ...(businessProfileId ? { businessProfileId } : {})
      },
      orderBy: { date: 'desc' },
      take: 100
    });

    console.log(`\n=== ALL TRANSACTIONS (Last 100) ===`);
    console.log(`Total transactions: ${allTransactions.length}`);
    
    if (allTransactions.length > 0) {
      console.log('\nSample transactions:');
      allTransactions.slice(0, 10).forEach(t => {
        console.log(`  ${new Date(t.date).toISOString().split('T')[0]} - ${t.description} - ${t.type} - $${t.amount}`);
      });
    }

    // Group by month and type
    const monthlyData = {};
    allTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0, count: 0, incomeCount: 0, expenseCount: 0 };
      }
      
      monthlyData[monthKey].count++;
      if (t.type === 'INCOME') {
        monthlyData[monthKey].income += Number(t.amount);
        monthlyData[monthKey].incomeCount++;
      } else if (t.type === 'EXPENSE') {
        monthlyData[monthKey].expense += Math.abs(Number(t.amount));
        monthlyData[monthKey].expenseCount++;
      }
    });

    console.log('\nMonthly Breakdown:');
    Object.keys(monthlyData).sort().reverse().slice(0, 6).forEach(monthKey => {
      const data = monthlyData[monthKey];
      console.log(`\n${monthKey}:`);
      console.log(`  Total Transactions: ${data.count}`);
      console.log(`  Income Count: ${data.incomeCount}`);
      console.log(`  Income: $${data.income.toFixed(2)}`);
      console.log(`  Expense Count: ${data.expenseCount}`);
      console.log(`  Expenses: $${data.expense.toFixed(2)}`);
      console.log(`  Net: $${(data.income - data.expense).toFixed(2)}`);
    });

    // Check what the dashboard is calculating for current month
    const incomeTransactions = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        ...(businessProfileId ? { businessProfileId } : {}),
        type: 'INCOME',
        date: { 
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      _sum: { amount: true },
      _count: true
    });

    const expenseTransactions = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        ...(businessProfileId ? { businessProfileId } : {}),
        type: 'EXPENSE',
        date: { 
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      _sum: { amount: true },
      _count: true
    });

    console.log(`\n=== DASHBOARD CALCULATIONS (Current Month: ${currentMonth + 1}/${currentYear}) ===`);
    console.log(`Income Transactions: ${incomeTransactions._count}`);
    console.log(`Income Total: $${(incomeTransactions._sum.amount || 0).toFixed(2)}`);
    console.log(`Expense Transactions: ${expenseTransactions._count}`);
    console.log(`Expense Total: $${Math.abs(expenseTransactions._sum.amount || 0).toFixed(2)}`);

    // Check budgets
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        ...(businessProfileId ? { businessProfileId } : {}),
        month: currentMonth + 1,
        year: currentYear
      }
    });

    console.log(`\n=== BUDGETS (Current Month) ===`);
    console.log(`Total budgets: ${budgets.length}`);
    let totalAllocated = 0;
    let totalSpent = 0;
    budgets.forEach(b => {
      console.log(`\n${b.category}:`);
      console.log(`  Allocated: $${b.amount.toFixed(2)}`);
      console.log(`  Spent: $${b.spent.toFixed(2)}`);
      console.log(`  Remaining: $${(b.amount - b.spent).toFixed(2)}`);
      totalAllocated += Number(b.amount);
      totalSpent += Number(b.spent);
    });
    
    console.log(`\nTotal Allocated: $${totalAllocated.toFixed(2)}`);
    console.log(`Total Spent: $${totalSpent.toFixed(2)}`);

    // Check bank statements
    const statements = await prisma.bankStatement.findMany({
      where: {
        userId: user.id,
        ...(businessProfileId ? { businessProfileId } : {})
      }
    });

    console.log(`\n=== BANK STATEMENTS ===`);
    console.log(`Total statements: ${statements.length}`);
    statements.forEach(s => {
      console.log(`\n${s.fileName}:`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Type: ${s.accountType}`);
      console.log(`  Created: ${s.createdAt.toISOString()}`);
    });

    const completedCount = statements.filter(s => s.status === 'COMPLETED').length;
    console.log(`\nCompleted statements: ${completedCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDashboardData();
