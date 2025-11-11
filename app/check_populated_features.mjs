import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPopulatedFeatures() {
  try {
    const userId = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!userId) {
      console.log('❌ User not found');
      return;
    }

    console.log('📊 FEATURE POPULATION SUMMARY\n');
    console.log('='.repeat(70));
    
    // Get profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: userId.id }
    });
    
    for (const profile of profiles) {
      console.log(`\n🏢 ${profile.name} (${profile.profileType})`);
      console.log('-'.repeat(70));
      
      // Budgets
      const budgets = await prisma.budget.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n💰 Budgets: ${budgets.length}`);
      budgets.slice(0, 5).forEach(b => {
        console.log(`   • ${b.name}: $${Number(b.amount || 0).toFixed(2)}`);
      });
      if (budgets.length > 5) console.log(`   ... and ${budgets.length - 5} more`);
      
      // Goals
      const goals = await prisma.goal.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n🎯 Financial Goals: ${goals.length}`);
      goals.forEach(g => {
        console.log(`   • ${g.name}: $${Number(g.targetAmount || 0).toFixed(2)} (Current: $${Number(g.currentAmount || 0).toFixed(2)}) - ${g.status}`);
      });
      
      // Debts
      const debts = await prisma.debt.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n💳 Debts: ${debts.length}`);
      debts.slice(0, 5).forEach(d => {
        console.log(`   • ${d.creditor}: $${Number(d.amount || 0).toFixed(2)} (${d.type}) - APR: ${Number(d.interestRate || 0).toFixed(2)}%`);
      });
      if (debts.length > 5) console.log(`   ... and ${debts.length - 5} more`);
      
      // Recurring Charges
      const recurring = await prisma.recurringCharge.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n🔄 Recurring Charges: ${recurring.length}`);
      recurring.slice(0, 5).forEach(r => {
        console.log(`   • ${r.merchant}: $${Number(r.amount || 0).toFixed(2)} (${r.frequency || 'N/A'})`);
      });
      if (recurring.length > 5) console.log(`   ... and ${recurring.length - 5} more`);
      
      // Categories with transaction counts
      const categories = await prisma.category.findMany({
        where: { businessProfileId: profile.id },
        include: {
          _count: {
            select: { transactions: true }
          }
        },
        orderBy: {
          transactions: {
            _count: 'desc'
          }
        }
      });
      console.log(`\n🏷️  Categories: ${categories.length}`);
      categories.slice(0, 10).forEach(c => {
        console.log(`   • ${c.name}: ${c._count.transactions} transactions`);
      });
      if (categories.length > 10) console.log(`   ... and ${categories.length - 10} more`);
      
      // Transaction count and totals
      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id }
      });
      
      const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
      console.log(`\n📊 Transaction Summary:`);
      console.log(`   • Total Transactions: ${transactions.length}`);
      console.log(`   • Total Income: $${income.toFixed(2)}`);
      console.log(`   • Total Expenses: $${Math.abs(expenses).toFixed(2)}`);
      console.log(`   • Net: $${(income + expenses).toFixed(2)}`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ FEATURE SUMMARY COMPLETE\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkPopulatedFeatures();
