import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllFeatures() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id },
      orderBy: { type: 'asc' }
    });
    
    console.log('\n📊 COMPREHENSIVE FEATURE AUTO-POPULATION REPORT');
    console.log('='.repeat(80));
    console.log(`User: ${user.email}`);
    console.log(`Date: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));
    
    for (const profile of profiles) {
      console.log(`\n\n${'█'.repeat(80)}`);
      console.log(`█  ${profile.name.toUpperCase()} (${profile.type})`);
      console.log(`${'█'.repeat(80)}\n`);
      
      // Get all transactions for context
      const allTransactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id }
      });
      
      const income = allTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount.toString()), 0);
      const expenses = allTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(parseFloat(t.amount.toString())), 0);
      
      console.log('📈 TRANSACTION OVERVIEW');
      console.log('-'.repeat(80));
      console.log(`   Total Transactions: ${allTransactions.length}`);
      console.log(`   Total Income:       $${income.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      console.log(`   Total Expenses:     $${expenses.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      console.log(`   Net Amount:         $${(income - expenses).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      
      // 1. Budget Planner
      const budgets = await prisma.budget.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n\n💰 BUDGET PLANNER: ${budgets.length} budgets created`);
      console.log('-'.repeat(80));
      if (budgets.length > 0) {
        const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount || 0), 0);
        console.log(`   Total Budgeted: $${totalBudgeted.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`\n   Sample Budgets:`);
        budgets.slice(0, 10).forEach((b, i) => {
          console.log(`   ${i+1}. ${b.name} - $${Number(b.amount || 0).toFixed(2)}`);
        });
        if (budgets.length > 10) {
          console.log(`   ... and ${budgets.length - 10} more budgets`);
        }
      } else {
        console.log('   ⚠️  No budgets created');
      }
      
      // 2. Financial Goals
      const goals = await prisma.goal.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n\n🎯 FINANCIAL GOALS: ${goals.length} goals created`);
      console.log('-'.repeat(80));
      if (goals.length > 0) {
        goals.forEach((g, i) => {
          const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount * 100).toFixed(1) : 0;
          console.log(`   ${i+1}. ${g.name}`);
          console.log(`      Target: $${Number(g.targetAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`);
          console.log(`      Current: $${Number(g.currentAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} (${progress}%)`);
          console.log(`      Status: ${g.status}${g.deadline ? ` | Deadline: ${g.deadline.toLocaleDateString()}` : ''}`);
        });
      } else {
        console.log('   ⚠️  No goals created - Insufficient transaction history (needs 3+ months)');
      }
      
      // 3. Debt Management
      const debts = await prisma.debt.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n\n💳 DEBT MANAGEMENT: ${debts.length} debts identified`);
      console.log('-'.repeat(80));
      if (debts.length > 0) {
        const totalDebt = debts.reduce((s, d) => s + Number(d.amount || 0), 0);
        console.log(`   Total Debt: $${totalDebt.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`\n   Debts:`);
        debts.forEach((d, i) => {
          console.log(`   ${i+1}. ${d.creditor} (${d.type})`);
          console.log(`      Balance: $${Number(d.amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`);
          console.log(`      APR: ${Number(d.interestRate || 0).toFixed(2)}%`);
          console.log(`      Min Payment: $${Number(d.minimumPayment || 0).toFixed(2)}`);
        });
      } else {
        console.log('   ✅ No recurring debt patterns detected');
      }
      
      // 4. Recurring Charges
      const recurring = await prisma.recurringCharge.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n\n🔄 RECURRING CHARGES: ${recurring.length} recurring charges detected`);
      console.log('-'.repeat(80));
      if (recurring.length > 0) {
        const monthlyRecurring = recurring.filter(r => r.frequency === 'MONTHLY');
        const yearlyRecurring = recurring.filter(r => r.frequency === 'ANNUALLY');
        console.log(`   Monthly: ${monthlyRecurring.length} | Annual: ${yearlyRecurring.length}`);
        console.log(`\n   Sample Recurring Charges:`);
        recurring.slice(0, 10).forEach((r, i) => {
          console.log(`   ${i+1}. ${r.merchant || 'Unknown Merchant'} - $${Number(r.amount || 0).toFixed(2)} (${r.frequency})`);
        });
        if (recurring.length > 10) {
          console.log(`   ... and ${recurring.length - 10} more recurring charges`);
        }
      } else {
        console.log('   ⚠️  No recurring charge patterns detected');
      }
      
      // 5. Performance Analytics (Check for metrics in transactions)
      const dates = allTransactions.map(t => t.date).filter(d => d).sort((a, b) => a - b);
      const dateRange = dates.length > 0 ? {
        start: dates[0],
        end: dates[dates.length - 1]
      } : null;
      
      console.log(`\n\n📊 PERFORMANCE ANALYTICS`);
      console.log('-'.repeat(80));
      if (dateRange) {
        console.log(`   Date Range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`);
        
        // Calculate month-over-month
        const monthlyData = {};
        allTransactions.forEach(t => {
          if (t.date) {
            const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { income: 0, expenses: 0 };
            }
            if (t.type === 'INCOME') {
              monthlyData[monthKey].income += parseFloat(t.amount.toString());
            } else {
              monthlyData[monthKey].expenses += Math.abs(parseFloat(t.amount.toString()));
            }
          }
        });
        
        const months = Object.keys(monthlyData).sort();
        console.log(`   Months Analyzed: ${months.length}`);
        months.forEach(month => {
          const data = monthlyData[month];
          console.log(`   ${month}: Income $${data.income.toFixed(2)}, Expenses $${data.expenses.toFixed(2)}`);
        });
      } else {
        console.log('   ⚠️  Insufficient date information');
      }
      
      // 6. Burn Rate
      console.log(`\n\n🔥 BURN RATE ANALYSIS`);
      console.log('-'.repeat(80));
      if (dateRange) {
        const monthSpan = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24 * 30));
        const avgMonthlyExpenses = expenses / Math.max(monthSpan, 1);
        const avgMonthlyIncome = income / Math.max(monthSpan, 1);
        const burnRate = avgMonthlyExpenses - avgMonthlyIncome;
        const currentCash = income - expenses;
        const runway = burnRate > 0 ? currentCash / burnRate : Infinity;
        
        console.log(`   Average Monthly Income:   $${avgMonthlyIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`   Average Monthly Expenses: $${avgMonthlyExpenses.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`   Monthly Burn Rate:        $${Math.abs(burnRate).toLocaleString('en-US', {minimumFractionDigits: 2})} ${burnRate > 0 ? '🔴 (Losing Money)' : '🟢 (Profitable)'}`);
        console.log(`   Current Cash Position:    $${currentCash.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`   Runway:                   ${isFinite(runway) ? runway.toFixed(1) + ' months' : '∞ (Profitable)'}`);
      } else {
        console.log('   ⚠️  Insufficient date information');
      }
      
      // 7. Treasury & Cash Management
      console.log(`\n\n💰 TREASURY & CASH MANAGEMENT`);
      console.log('-'.repeat(80));
      console.log(`   Current Cash Position: $${(income - expenses).toLocaleString('en-US', {minimumFractionDigits: 2})}`);
      console.log(`   Monthly Cash Flow Trend: ${income > expenses ? '🟢 Positive' : '🔴 Negative'}`);
      
      // 8. Risk Management
      console.log(`\n\n🛡️ RISK MANAGEMENT`);
      console.log('-'.repeat(80));
      const avgExpenseAmount = expenses / Math.max(allTransactions.filter(t => t.type === 'EXPENSE').length, 1);
      const largeExpenses = allTransactions.filter(t => 
        t.type === 'EXPENSE' && Math.abs(parseFloat(t.amount.toString())) > avgExpenseAmount * 3
      );
      console.log(`   Large Expense Threshold: $${(avgExpenseAmount * 3).toFixed(2)}`);
      console.log(`   Large Expenses Detected: ${largeExpenses.length}`);
      if (largeExpenses.length > 0) {
        largeExpenses.slice(0, 5).forEach((e, i) => {
          console.log(`   ${i+1}. $${Math.abs(parseFloat(e.amount.toString())).toFixed(2)} - ${e.description}`);
        });
      }
      
      // 9. Investment Analytics
      const investmentCategories = ['Investments', 'Stocks', 'Bonds', 'Mutual Funds', 'Crypto', 'Investment'];
      const investmentTxns = allTransactions.filter(t => 
        t.categoryId && investmentCategories.some(cat => 
          t.description?.toLowerCase().includes(cat.toLowerCase())
        )
      );
      console.log(`\n\n📈 INVESTMENT ANALYTICS`);
      console.log('-'.repeat(80));
      if (investmentTxns.length > 0) {
        const invested = investmentTxns.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(parseFloat(t.amount.toString())), 0);
        const returns = investmentTxns.filter(t => t.type === 'INCOME').reduce((s, t) => s + parseFloat(t.amount.toString()), 0);
        const roi = invested > 0 ? ((returns - invested) / invested * 100).toFixed(2) : 0;
        
        console.log(`   Total Invested: $${invested.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`   Total Returns:  $${returns.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
        console.log(`   ROI:            ${roi}%`);
        console.log(`   Transactions:   ${investmentTxns.length}`);
      } else {
        console.log('   ⚠️  No investment transactions detected');
      }
    }
    
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ COMPREHENSIVE FEATURE AUTO-POPULATION REPORT COMPLETE');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFeatures();
