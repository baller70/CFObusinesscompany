import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkPersonalFeatures() {
  try {
    console.log('\n🔍 CHECKING PERSONAL FINANCE FEATURES\n');
    console.log('=' .repeat(60));

    // Get user and profiles
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${user.email}`);
    console.log(`📊 Current Active Profile: ${user.currentBusinessProfileId}`);

    // Find Personal profile
    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');

    if (!personalProfile) {
      console.log('\n❌ No PERSONAL profile found!');
      return;
    }

    console.log(`\n🏠 Personal Profile: ${personalProfile.name} (ID: ${personalProfile.id})`);
    console.log(`🏢 Business Profile: ${businessProfile?.name || 'N/A'} (ID: ${businessProfile?.id || 'N/A'})`);

    // Check transactions
    console.log('\n' + '='.repeat(60));
    console.log('📋 TRANSACTIONS');
    console.log('='.repeat(60));

    const personalTransactions = await prisma.transaction.findMany({
      where: { businessProfileId: personalProfile.id }
    });

    const income = personalTransactions.filter(t => t.type === 'INCOME');
    const expenses = personalTransactions.filter(t => t.type === 'EXPENSE');

    console.log(`Total Transactions: ${personalTransactions.length}`);
    console.log(`  💰 Income: ${income.length} ($${income.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2)})`);
    console.log(`  💸 Expenses: ${expenses.length} (-$${expenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0).toFixed(2)})`);

    // Sample transactions
    console.log('\nSample Transactions:');
    personalTransactions.slice(0, 5).forEach(t => {
      console.log(`  ${t.date.toISOString().split('T')[0]} | ${t.type} | ${t.category || 'N/A'} | $${t.amount}`);
    });

    // Check Budget Planner
    console.log('\n' + '='.repeat(60));
    console.log('💰 BUDGET PLANNER');
    console.log('='.repeat(60));

    const budgets = await prisma.budget.findMany({
      where: { businessProfileId: personalProfile.id }
    });

    console.log(`Total Budgets: ${budgets.length}`);
    if (budgets.length > 0) {
      console.log('\nBudgets:');
      budgets.slice(0, 10).forEach(b => {
        console.log(`  ${b.category}: $${b.amount} (${b.type}) - Spent: $${b.spent || 0}`);
      });
    } else {
      console.log('  ❌ NO BUDGETS FOUND');
    }

    // Check Financial Goals
    console.log('\n' + '='.repeat(60));
    console.log('🎯 FINANCIAL GOALS');
    console.log('='.repeat(60));

    const goals = await prisma.goal.findMany({
      where: { businessProfileId: personalProfile.id }
    });

    console.log(`Total Goals: ${goals.length}`);
    if (goals.length > 0) {
      console.log('\nGoals:');
      goals.forEach(g => {
        console.log(`  ${g.name}: $${g.currentAmount}/$${g.targetAmount} (${g.status})`);
      });
    } else {
      console.log('  ❌ NO GOALS FOUND');
    }

    // Check Debt Management
    console.log('\n' + '='.repeat(60));
    console.log('💳 DEBT MANAGEMENT');
    console.log('='.repeat(60));

    const debts = await prisma.debt.findMany({
      where: { businessProfileId: personalProfile.id }
    });

    console.log(`Total Debts: ${debts.length}`);
    if (debts.length > 0) {
      console.log('\nDebts:');
      debts.forEach(d => {
        console.log(`  ${d.name}: $${d.currentBalance} (${d.status})`);
      });
    } else {
      console.log('  ❌ NO DEBTS FOUND');
    }

    // Check Categories
    console.log('\n' + '='.repeat(60));
    console.log('📁 CATEGORIES');
    console.log('='.repeat(60));

    const categories = await prisma.category.findMany({
      where: { businessProfileId: personalProfile.id }
    });

    console.log(`Total Categories: ${categories.length}`);
    if (categories.length > 0) {
      console.log('\nCategories:');
      categories.slice(0, 15).forEach(c => {
        console.log(`  ${c.name} (${c.type}): ${c.icon || 'no icon'}`);
      });
    } else {
      console.log('  ❌ NO CATEGORIES FOUND');
    }

    // Check transaction categories distribution
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRANSACTION CATEGORIES BREAKDOWN');
    console.log('='.repeat(60));

    const categoryCounts = {};
    personalTransactions.forEach(t => {
      const cat = t.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} transactions`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ CHECK COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPersonalFeatures();
