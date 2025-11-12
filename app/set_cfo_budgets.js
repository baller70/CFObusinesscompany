const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function setCFOBudgets() {
  try {
    console.log('🎯 CFO BUDGETING APP - Setting Intelligent Budget Limits\n');
    
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('📊 Analyzing transaction patterns for budget creation...\n');
    
    // Process each profile
    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 PROFILE: ${profile.name} (${profile.type})`);
      console.log('='.repeat(60));
      
      // Get all expense transactions for this profile
      const expenses = await prisma.transaction.findMany({
        where: {
          businessProfileId: profile.id,
          type: 'EXPENSE'
        }
      });
      
      if (expenses.length === 0) {
        console.log('⚠️  No expense transactions found for this profile');
        continue;
      }
      
      // Group transactions by category and calculate monthly averages
      const categoryStats = {};
      expenses.forEach(t => {
        const cat = t.category || 'Uncategorized';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { total: 0, count: 0, transactions: [] };
        }
        categoryStats[cat].total += Math.abs(parseFloat(t.amount));
        categoryStats[cat].count++;
        categoryStats[cat].transactions.push(t.date);
      });
      
      // Calculate date range to determine monthly average
      const allDates = expenses.map(t => new Date(t.date));
      const minDate = new Date(Math.min(...allDates));
      const maxDate = new Date(Math.max(...allDates));
      const monthsSpan = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 30)));
      
      console.log(`\n📅 Transaction period: ${minDate.toLocaleDateString()} to ${maxDate.toLocaleDateString()}`);
      console.log(`📊 Months of data: ${monthsSpan}`);
      console.log(`💳 Total expense transactions: ${expenses.length}\n`);
      
      // CFO Strategy: Set budgets at 110% of average monthly spend
      // This provides a buffer while maintaining fiscal discipline
      console.log('💰 SETTING BUDGET LIMITS (110% of avg monthly spend):\n');
      
      const budgetUpdates = [];
      
      for (const [categoryName, stats] of Object.entries(categoryStats)) {
        const avgMonthlySpend = stats.total / monthsSpan;
        const recommendedBudget = avgMonthlySpend * 1.10; // 10% buffer
        
        // Find or create category
        let category = await prisma.category.findFirst({
          where: {
            name: categoryName,
            businessProfileId: profile.id
          }
        });
        
        if (!category) {
          // Create category if it doesn't exist
          category = await prisma.category.create({
            data: {
              name: categoryName,
              type: 'EXPENSE',
              businessProfileId: profile.id,
              userId: user.id,
              icon: '📊',
              color: '#3B82F6'
            }
          });
          console.log(`  ✨ Created category: ${categoryName}`);
        }
        
        // Update budget limit
        await prisma.category.update({
          where: { id: category.id },
          data: { budget: recommendedBudget }
        });
        
        budgetUpdates.push({
          category: categoryName,
          transactions: stats.count,
          totalSpent: stats.total,
          avgMonthly: avgMonthlySpend,
          budgetLimit: recommendedBudget
        });
        
        console.log(`  ✅ ${categoryName}`);
        console.log(`     - Transactions: ${stats.count}`);
        console.log(`     - Total Spent: $${stats.total.toFixed(2)}`);
        console.log(`     - Avg Monthly: $${avgMonthlySpend.toFixed(2)}`);
        console.log(`     - Budget Limit: $${recommendedBudget.toFixed(2)} ✨`);
        console.log();
      }
      
      // Summary
      const totalBudget = budgetUpdates.reduce((sum, b) => sum + b.budgetLimit, 0);
      const totalSpent = budgetUpdates.reduce((sum, b) => sum + b.avgMonthly, 0);
      
      console.log(`\n📈 PROFILE SUMMARY:`);
      console.log(`   Total Monthly Budget Set: $${totalBudget.toFixed(2)}`);
      console.log(`   Average Monthly Spending: $${totalSpent.toFixed(2)}`);
      console.log(`   Budget Buffer: $${(totalBudget - totalSpent).toFixed(2)} (10%)`);
      console.log(`   Categories Budgeted: ${budgetUpdates.length}`);
    }
    
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('✅ CFO BUDGET LIMITS SUCCESSFULLY SET');
    console.log('='.repeat(60));
    console.log('\n📍 Next Steps:');
    console.log('   1. Go to: Personal Finance → Categories → Budget Tracking tab');
    console.log('   2. View your intelligent budget limits with performance tracking');
    console.log('   3. Monitor spending vs. budget with color-coded indicators');
    console.log('\n🔗 Navigate to: https://cfo-budgeting-app-zgajgy.abacusai.app/dashboard/categories');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

setCFOBudgets();
