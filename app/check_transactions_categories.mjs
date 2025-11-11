import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransactionCategories() {
  try {
    console.log('='.repeat(80));
    console.log('CHECKING TRANSACTION CATEGORIZATION');
    console.log('='.repeat(80));

    // Get user
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n✅ User: ${user.email}`);
    console.log(`📋 Business Profiles: ${user.businessProfiles.length}`);

    // Check each profile
    for (const profile of user.businessProfiles) {
      console.log('\n' + '='.repeat(80));
      console.log(`📊 PROFILE: ${profile.name} (${profile.type})`);
      console.log('='.repeat(80));

      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { date: 'desc' },
        take: 200
      });

      console.log(`\n📈 Total Transactions: ${transactions.length}`);

      // Count by type
      const income = transactions.filter(t => t.type === 'INCOME');
      const expenses = transactions.filter(t => t.type === 'EXPENSE');
      
      console.log(`  💰 Income: ${income.length} transactions`);
      console.log(`  💸 Expenses: ${expenses.length} transactions`);

      // Check categorization
      const uncategorized = transactions.filter(t => !t.category || t.category === 'Uncategorized' || t.category === 'Other');
      console.log(`\n⚠️  Uncategorized/Other: ${uncategorized.length} transactions`);

      // Show category breakdown
      const categoryMap = {};
      transactions.forEach(t => {
        const cat = t.category || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });

      console.log('\n📂 Category Breakdown:');
      Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`   ${cat}: ${count} transactions`);
        });

      // Show sample transactions
      console.log('\n📝 Sample Transactions (first 10):');
      transactions.slice(0, 10).forEach((t, idx) => {
        const amount = t.type === 'INCOME' ? `+$${t.amount}` : `-$${t.amount}`;
        console.log(`   ${idx + 1}. ${t.date.toISOString().split('T')[0]} | ${t.description.substring(0, 40)} | ${amount} | Category: ${t.category || 'NONE'} | Type: ${t.type}`);
      });
    }

    // Get available categories
    console.log('\n' + '='.repeat(80));
    console.log('📚 AVAILABLE CATEGORIES IN DATABASE');
    console.log('='.repeat(80));
    
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n✅ Total Categories: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionCategories();
