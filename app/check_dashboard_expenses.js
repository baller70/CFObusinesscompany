require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExpenses() {
  const user = await prisma.user.findUnique({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    include: { businessProfiles: true }
  });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User ID:', user.id);
  console.log('Current Business Profile ID:', user.currentBusinessProfileId);
  console.log('\nBusiness Profiles:');
  user.businessProfiles.forEach(p => {
    console.log(`  - ${p.name} (${p.type}) - ID: ${p.id}`);
  });
  
  // Check expense transactions for current profile
  const expenses = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      businessProfileId: user.currentBusinessProfileId,
      type: 'EXPENSE'
    },
    take: 10,
    orderBy: { date: 'desc' }
  });
  
  console.log('\n📊 Recent Expense Transactions for Current Profile:', expenses.length);
  if (expenses.length > 0) {
    console.log('Sample (first 3):');
    expenses.slice(0, 3).forEach(e => {
      console.log(`  - ${e.date.toISOString().split('T')[0]}: $${Math.abs(e.amount)} - ${e.description} (${e.category})`);
    });
  }
  
  // Check what the dashboard would query for the most recent month
  const mostRecent = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      businessProfileId: user.currentBusinessProfileId
    },
    orderBy: { date: 'desc' }
  });
  
  if (mostRecent) {
    const targetDate = mostRecent.date;
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);
    
    console.log(`\n📅 Dashboard Month Range: ${firstDayOfMonth.toISOString().split('T')[0]} to ${lastDayOfMonth.toISOString().split('T')[0]}`);
    
    // Check expenses for this specific month (what dashboard queries)
    const monthExpenses = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        businessProfileId: user.currentBusinessProfileId,
        type: 'EXPENSE',
        date: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      _sum: { amount: true },
      _count: true
    });
    
    console.log(`\n💰 Expenses for this month (what dashboard shows):`);
    console.log(`   Count: ${monthExpenses._count}`);
    console.log(`   Total: $${Math.abs(monthExpenses._sum.amount || 0)}`);
  }
  
  // Check total expenses for all of 2024
  const total2024Expenses = await prisma.transaction.aggregate({
    where: {
      userId: user.id,
      businessProfileId: user.currentBusinessProfileId,
      type: 'EXPENSE',
      date: {
        gte: new Date('2024-01-01'),
        lte: new Date('2024-12-31')
      }
    },
    _sum: { amount: true },
    _count: true
  });
  
  console.log('\n📈 All 2024 Expenses:');
  console.log(`   Count: ${total2024Expenses._count}`);
  console.log(`   Total: $${Math.abs(total2024Expenses._sum.amount || 0)}`);
  
  await prisma.$disconnect();
}

checkExpenses().catch(console.error);
