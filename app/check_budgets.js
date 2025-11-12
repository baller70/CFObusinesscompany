require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBudgets() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.email);
    console.log('Business Profiles:', user.businessProfiles.map(p => ({ id: p.id, name: p.name, type: p.type })));
    
    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { category: 'asc' }]
    });
    
    console.log('\n=== BUDGETS IN DATABASE ===');
    console.log('Total budgets:', budgets.length);
    
    if (budgets.length > 0) {
      console.log('\nFirst 10 budgets:');
      budgets.slice(0, 10).forEach(b => {
        console.log(`- ${b.category} | ${b.month}/${b.year} | Amount: $${b.amount} | Spent: $${b.spent || 0} | Type: ${b.type}`);
      });
      
      // Group by year and month
      const byYearMonth = {};
      budgets.forEach(b => {
        const key = `${b.year}-${String(b.month).padStart(2, '0')}`;
        if (!byYearMonth[key]) byYearMonth[key] = 0;
        byYearMonth[key]++;
      });
      
      console.log('\nBudgets by month:');
      Object.entries(byYearMonth).sort().forEach(([key, count]) => {
        console.log(`  ${key}: ${count} budgets`);
      });
    } else {
      console.log('NO BUDGETS FOUND IN DATABASE!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBudgets();
