const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkBudgets() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      include: { businessProfile: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📊 EXISTING BUDGETS:', budgets.length);
    if (budgets.length > 0) {
      console.log('\nFirst 10 budgets:');
      budgets.slice(0, 10).forEach(b => {
        console.log(`  - ${b.category}: $${b.amount} (${b.type})`);
        console.log(`    Period: ${b.month}/${b.year}`);
        console.log(`    Profile: ${b.businessProfile.name}`);
      });
    }
    
    // Check transaction date ranges
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: { in: user.businessProfiles.map(p => p.id) }
      },
      orderBy: { date: 'asc' }
    });
    
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date));
      console.log(`\n📅 TRANSACTION DATE RANGE:`);
      console.log(`  Earliest: ${dates[0].toLocaleDateString()}`);
      console.log(`  Latest: ${dates[dates.length - 1].toLocaleDateString()}`);
      console.log(`  Total Transactions: ${transactions.length}`);
      
      // Group by month/year
      const byMonth = {};
      transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (!byMonth[key]) byMonth[key] = 0;
        byMonth[key]++;
      });
      
      console.log('\n📊 TRANSACTIONS BY MONTH:');
      Object.entries(byMonth).sort().forEach(([month, count]) => {
        console.log(`  ${month}: ${count} transactions`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBudgets();
