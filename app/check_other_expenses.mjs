import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOtherExpenses() {
  try {
    console.log('='.repeat(80));
    console.log('CHECKING "OTHER EXPENSES" TRANSACTIONS');
    console.log('='.repeat(80));

    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: true
      }
    });

    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 PROFILE: ${profile.name} (${profile.type})`);
      console.log('='.repeat(80));

      const otherTransactions = await prisma.transaction.findMany({
        where: {
          businessProfileId: profile.id,
          category: 'Other Expenses'
        },
        orderBy: { date: 'desc' },
        take: 30
      });

      console.log(`\n⚠️  Other Expenses: ${otherTransactions.length} transactions`);
      console.log('\n📝 Sample "Other Expenses" Transactions (showing 30):');
      
      otherTransactions.forEach((t, idx) => {
        const amount = t.type === 'INCOME' ? `+$${t.amount}` : `-$${t.amount}`;
        console.log(`   ${idx + 1}. ${t.description.substring(0, 80)} | ${amount}`);
      });

      // Show all transactions to understand better
      console.log('\n📊 All Categories for this profile:');
      const allTransactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id }
      });

      const categoryMap = {};
      allTransactions.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
      });

      Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          console.log(`   ${cat}: ${count} transactions`);
        });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOtherExpenses();
