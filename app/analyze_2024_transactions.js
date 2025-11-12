require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    // Fetch all 2024 transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-12-31')
        }
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`Total 2024 transactions: ${transactions.length}`);
    
    // Group by month and category
    const byMonth = {};
    transactions.forEach(t => {
      const month = t.date.getMonth() + 1; // 1-12
      const key = `${month}`;
      
      if (!byMonth[key]) {
        byMonth[key] = { categories: {}, count: 0 };
      }
      byMonth[key].count++;
      
      if (!byMonth[key].categories[t.category]) {
        byMonth[key].categories[t.category] = { count: 0, total: 0, type: t.type };
      }
      byMonth[key].categories[t.category].count++;
      byMonth[key].categories[t.category].total += t.amount;
    });
    
    console.log('\n=== 2024 TRANSACTION BREAKDOWN BY MONTH ===');
    for (let m = 1; m <= 12; m++) {
      const monthData = byMonth[m.toString()];
      if (monthData) {
        console.log(`\nMonth ${m}/2024: ${monthData.count} transactions`);
        const categories = Object.entries(monthData.categories).sort((a, b) => b[1].count - a[1].count);
        console.log(`  Categories: ${categories.length}`);
        categories.slice(0, 5).forEach(([cat, data]) => {
          console.log(`    - ${cat}: ${data.count} txns, Total: $${data.total.toFixed(2)} (${data.type})`);
        });
      } else {
        console.log(`\nMonth ${m}/2024: NO TRANSACTIONS`);
      }
    }
    
    // Get unique categories across all of 2024
    const allCategories = {};
    transactions.forEach(t => {
      if (!allCategories[t.category]) {
        allCategories[t.category] = { type: t.type, transactions: [] };
      }
      allCategories[t.category].transactions.push(t);
    });
    
    console.log(`\n\n=== UNIQUE CATEGORIES IN 2024: ${Object.keys(allCategories).length} ===`);
    Object.entries(allCategories).forEach(([cat, data]) => {
      console.log(`- ${cat} (${data.type}): ${data.transactions.length} transactions`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();
