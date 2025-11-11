import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function verify2024Complete() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('📊 2024 DATA VERIFICATION REPORT');
    console.log('='.repeat(70));
    console.log(`Generated: ${new Date().toISOString()}`);
    console.log('='.repeat(70));

    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${user.email}`);
    console.log(`📋 Profiles: ${user.businessProfiles.length}\n`);

    for (const profile of user.businessProfiles) {
      console.log('\n' + '═'.repeat(70));
      console.log(`📁 ${profile.name} (${profile.type})`);
      console.log('═'.repeat(70));

      // Transactions
      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { date: 'asc' }
      });

      if (transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const year2024 = transactions.filter(t => new Date(t.date).getFullYear() === 2024).length;
        const year2025 = transactions.filter(t => new Date(t.date).getFullYear() === 2025).length;
        const otherYears = transactions.length - year2024 - year2025;

        console.log('\n💵 TRANSACTIONS:');
        console.log(`   Total: ${transactions.length}`);
        console.log(`   Date Range: ${minDate.toISOString().substring(0, 10)} to ${maxDate.toISOString().substring(0, 10)}`);
        console.log(`   ✓ 2024: ${year2024} transactions`);
        if (year2025 > 0) console.log(`   ⚠️  2025: ${year2025} transactions`);
        if (otherYears > 0) console.log(`   ⚠️  Other: ${otherYears} transactions`);

        // Month breakdown
        const monthBreakdown = {};
        transactions
          .filter(t => new Date(t.date).getFullYear() === 2024)
          .forEach(t => {
            const month = new Date(t.date).toISOString().substring(0, 7);
            monthBreakdown[month] = (monthBreakdown[month] || 0) + 1;
          });

        console.log('\n   📅 2024 Monthly Distribution:');
        Object.entries(monthBreakdown).sort().forEach(([month, count]) => {
          const monthName = new Date(month + '-01').toLocaleString('default', { month: 'short' });
          console.log(`      ${monthName} 2024: ${count} transactions`);
        });

        // Income/Expense breakdown
        const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
        
        console.log('\n   💰 Financial Summary:');
        console.log(`      Total Income: $${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`      Total Expenses: $${expenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        console.log(`      Net: $${(income - expenses).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }

      // Budgets
      const budgets = await prisma.budget.findMany({
        where: { businessProfileId: profile.id }
      });
      const budgets2024 = budgets.filter(b => b.year === 2024).length;
      const budgets2025 = budgets.filter(b => b.year === 2025).length;
      
      console.log('\n💰 BUDGETS:');
      console.log(`   Total: ${budgets.length}`);
      console.log(`   ✓ 2024: ${budgets2024} budgets`);
      if (budgets2025 > 0) console.log(`   ⚠️  2025: ${budgets2025} budgets`);

      // Goals
      const goals = await prisma.goal.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log('\n🎯 GOALS:');
      console.log(`   Total: ${goals.length}`);

      // Debts
      const debts = await prisma.debt.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log('\n💳 DEBTS:');
      console.log(`   Total: ${debts.length}`);
      if (debts.length > 0) {
        const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0);
        console.log(`   Total Balance: $${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      }

      // Recurring Charges
      const recurring = await prisma.recurringCharge.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log('\n🔄 RECURRING CHARGES:');
      console.log(`   Total: ${recurring.length}`);

      // Bills
      const bills = await prisma.bill.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log('\n📄 BILLS:');
      console.log(`   Total: ${bills.length}`);

      // Bank Statements
      const statements = await prisma.bankStatement.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { createdAt: 'asc' }
      });
      console.log('\n📊 BANK STATEMENTS:');
      console.log(`   Total: ${statements.length}`);
      if (statements.length > 0) {
        console.log('\n   Statements:');
        statements.forEach(s => {
          console.log(`      • ${s.statementPeriod || s.fileName} (${s.status})`);
        });
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('✅ VERIFICATION SUMMARY');
    console.log('═'.repeat(70));

    // Overall stats
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.id }
    });

    const all2024 = allTransactions.filter(t => new Date(t.date).getFullYear() === 2024).length;
    const all2025 = allTransactions.filter(t => new Date(t.date).getFullYear() === 2025).length;

    console.log(`\n📊 TOTAL TRANSACTIONS: ${allTransactions.length}`);
    console.log(`   ✓ 2024: ${all2024} (${(all2024/allTransactions.length*100).toFixed(1)}%)`);
    if (all2025 > 0) {
      console.log(`   ⚠️  2025: ${all2025} (${(all2025/allTransactions.length*100).toFixed(1)}%)`);
    }

    const allBudgets = await prisma.budget.findMany({
      where: {
        businessProfileId: { in: user.businessProfiles.map(p => p.id) }
      }
    });
    const allBudgets2024 = allBudgets.filter(b => b.year === 2024).length;
    const allBudgets2025 = allBudgets.filter(b => b.year === 2025).length;

    console.log(`\n💰 TOTAL BUDGETS: ${allBudgets.length}`);
    console.log(`   ✓ 2024: ${allBudgets2024} (${(allBudgets2024/allBudgets.length*100).toFixed(1)}%)`);
    if (allBudgets2025 > 0) {
      console.log(`   ⚠️  2025: ${allBudgets2025} (${(allBudgets2025/allBudgets.length*100).toFixed(1)}%)`);
    }

    console.log('\n' + '═'.repeat(70));
    if (all2025 === 0 && allBudgets2025 === 0) {
      console.log('✅ ALL DATA IS NOW PROPERLY SET TO 2024!');
      console.log('✅ READY TO UPLOAD 2025 STATEMENTS!');
    } else {
      console.log('⚠️  SOME 2025 DATA STILL EXISTS - NEEDS ADDITIONAL REVIEW');
    }
    console.log('═'.repeat(70));
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verify2024Complete();
