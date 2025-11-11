import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function analyze2024Financials() {
  try {
    console.log('\n💼 CFO-LEVEL FINANCIAL ANALYSIS - 2024 DATA\n');
    console.log('='.repeat(70));

    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const analysis = {
      personal: {},
      business: {},
      combined: {}
    };

    for (const profile of user.businessProfiles) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`📊 ${profile.name} (${profile.type})`);
      console.log('═'.repeat(70));

      // Get all 2024 transactions
      const transactions = await prisma.transaction.findMany({
        where: { 
          businessProfileId: profile.id,
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        }
      });

      console.log(`\n📈 Total Transactions: ${transactions.length}`);

      // Income Analysis
      const income = transactions.filter(t => t.amount > 0);
      const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
      const avgMonthlyIncome = totalIncome / 12;

      console.log(`\n💰 INCOME ANALYSIS:`);
      console.log(`   Total Annual Income: $${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Average Monthly Income: $${avgMonthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Number of Income Transactions: ${income.length}`);

      // Income by category
      const incomeByCategory = {};
      income.forEach(t => {
        const cat = t.category || 'Uncategorized';
        incomeByCategory[cat] = (incomeByCategory[cat] || 0) + t.amount;
      });

      console.log(`\n   Top Income Sources:`);
      Object.entries(incomeByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([cat, amount]) => {
          console.log(`      • ${cat}: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        });

      // Expense Analysis
      const expenses = transactions.filter(t => t.amount < 0);
      const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
      const avgMonthlyExpenses = totalExpenses / 12;

      console.log(`\n💳 EXPENSE ANALYSIS:`);
      console.log(`   Total Annual Expenses: $${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Average Monthly Expenses: $${avgMonthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Number of Expense Transactions: ${expenses.length}`);

      // Expenses by category
      const expensesByCategory = {};
      expenses.forEach(t => {
        const cat = t.category || 'Uncategorized';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(t.amount);
      });

      console.log(`\n   Top Expense Categories:`);
      Object.entries(expensesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([cat, amount]) => {
          const percentage = (amount / totalExpenses * 100).toFixed(1);
          console.log(`      • ${cat}: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`);
        });

      // Cash Flow Analysis
      const netCashFlow = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome * 100).toFixed(1) : 0;

      console.log(`\n📊 CASH FLOW ANALYSIS:`);
      console.log(`   Net Cash Flow: $${netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Savings Rate: ${savingsRate}%`);
      console.log(`   Monthly Net: $${(netCashFlow / 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

      // Monthly Trend Analysis
      const monthlyData = {};
      transactions.forEach(t => {
        const month = new Date(t.date).toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 };
        }
        if (t.amount > 0) {
          monthlyData[month].income += t.amount;
        } else {
          monthlyData[month].expenses += Math.abs(t.amount);
        }
      });

      console.log(`\n📅 MONTHLY TRENDS:`);
      const months = Object.keys(monthlyData).sort();
      const avgMonthlyNet = months.reduce((sum, month) => {
        return sum + (monthlyData[month].income - monthlyData[month].expenses);
      }, 0) / months.length;

      console.log(`   Average Monthly Net: $${avgMonthlyNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      
      // Identify best and worst months
      const monthlyNets = months.map(month => ({
        month,
        net: monthlyData[month].income - monthlyData[month].expenses
      }));
      
      const bestMonth = monthlyNets.reduce((max, m) => m.net > max.net ? m : max);
      const worstMonth = monthlyNets.reduce((min, m) => m.net < min.net ? m : min);

      console.log(`   Best Month: ${bestMonth.month} ($${bestMonth.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);
      console.log(`   Worst Month: ${worstMonth.month} ($${worstMonth.net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`);

      // Get existing debts
      const debts = await prisma.debt.findMany({
        where: { businessProfileId: profile.id }
      });

      const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0);

      console.log(`\n💳 DEBT ANALYSIS:`);
      console.log(`   Total Debt: $${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`   Number of Debts: ${debts.length}`);
      
      if (debts.length > 0) {
        debts.forEach(d => {
          console.log(`      • ${d.name}: $${(d.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @ ${d.interestRate || 0}% APR`);
        });
      }

      // Store analysis
      const profileAnalysis = {
        profileId: profile.id,
        profileName: profile.name,
        profileType: profile.type,
        totalIncome,
        avgMonthlyIncome,
        totalExpenses,
        avgMonthlyExpenses,
        netCashFlow,
        savingsRate: parseFloat(savingsRate),
        avgMonthlyNet,
        totalDebt,
        incomeByCategory,
        expensesByCategory,
        monthlyData,
        bestMonth,
        worstMonth,
        transactionCount: transactions.length
      };

      if (profile.type === 'PERSONAL') {
        analysis.personal = profileAnalysis;
      } else {
        analysis.business = profileAnalysis;
      }
    }

    // Combined Analysis
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`🏆 COMBINED FINANCIAL POSITION`);
    console.log('═'.repeat(70));

    const combinedIncome = (analysis.personal.totalIncome || 0) + (analysis.business.totalIncome || 0);
    const combinedExpenses = (analysis.personal.totalExpenses || 0) + (analysis.business.totalExpenses || 0);
    const combinedNet = combinedIncome - combinedExpenses;
    const combinedDebt = (analysis.personal.totalDebt || 0) + (analysis.business.totalDebt || 0);

    console.log(`\n💰 Total Annual Income: $${combinedIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`💳 Total Annual Expenses: $${combinedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`📊 Net Cash Flow: $${combinedNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`💵 Overall Savings Rate: ${(combinedNet / combinedIncome * 100).toFixed(1)}%`);
    console.log(`🏦 Total Debt: $${combinedDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    analysis.combined = {
      totalIncome: combinedIncome,
      totalExpenses: combinedExpenses,
      netCashFlow: combinedNet,
      savingsRate: (combinedNet / combinedIncome * 100),
      totalDebt: combinedDebt
    };

    console.log('\n' + '═'.repeat(70));
    console.log('✅ ANALYSIS COMPLETE - DATA STORED IN MEMORY');
    console.log('═'.repeat(70));

    // Write analysis to file for next script to use
    const fs = await import('fs');
    await fs.promises.writeFile(
      '/tmp/financial_analysis_2024.json', 
      JSON.stringify(analysis, null, 2)
    );
    console.log('\n✅ Analysis saved to /tmp/financial_analysis_2024.json\n');

    return analysis;

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

await analyze2024Financials();
