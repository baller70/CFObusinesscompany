const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function create2024MonthlyBudgets() {
  try {
    console.log('🎯 CREATING MONTHLY BUDGETS FOR ALL OF 2024\n');
    console.log('='.repeat(70));
    
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Delete existing 2024 budgets to start fresh
    const deleted = await prisma.budget.deleteMany({
      where: {
        userId: user.id,
        year: 2024
      }
    });
    console.log(`\n🗑️  Deleted ${deleted.count} existing 2024 budgets\n`);
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let totalBudgetsCreated = 0;
    
    // Process each profile
    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📁 PROFILE: ${profile.name} (${profile.type})`);
      console.log('='.repeat(70));
      
      // Get all transactions for this profile in 2024
      const allTransactions = await prisma.transaction.findMany({
        where: {
          businessProfileId: profile.id,
          date: {
            gte: new Date('2024-01-01'),
            lt: new Date('2025-01-01')
          }
        }
      });
      
      console.log(`\n📊 Total 2024 Transactions: ${allTransactions.length}`);
      
      // Group by month and category
      const monthlyData = {};
      
      for (let monthNum = 1; monthNum <= 12; monthNum++) {
        monthlyData[monthNum] = {
          expenses: {},
          income: {}
        };
      }
      
      allTransactions.forEach(t => {
        const date = new Date(t.date);
        const month = date.getMonth() + 1; // 1-12
        const amount = Math.abs(parseFloat(t.amount));
        const category = t.category || 'Uncategorized';
        
        if (t.type === 'EXPENSE') {
          if (!monthlyData[month].expenses[category]) {
            monthlyData[month].expenses[category] = 0;
          }
          monthlyData[month].expenses[category] += amount;
        } else if (t.type === 'INCOME') {
          if (!monthlyData[month].income[category]) {
            monthlyData[month].income[category] = 0;
          }
          monthlyData[month].income[category] += amount;
        }
      });
      
      // Create budgets for each month
      for (let monthNum = 1; monthNum <= 12; monthNum++) {
        const monthName = months[monthNum - 1];
        const expenses = monthlyData[monthNum].expenses;
        const income = monthlyData[monthNum].income;
        
        console.log(`\n📅 ${monthName} 2024:`);
        
        // Create expense budgets
        for (const [category, spent] of Object.entries(expenses)) {
          if (spent > 0) {
            const budgetAmount = spent * 1.10; // 10% buffer
            
            await prisma.budget.upsert({
              where: {
                userId_businessProfileId_category_month_year: {
                  userId: user.id,
                  businessProfileId: profile.id,
                  category: category,
                  month: monthNum,
                  year: 2024
                }
              },
              update: {
                amount: budgetAmount,
                spent: spent
              },
              create: {
                userId: user.id,
                businessProfileId: profile.id,
                name: `${category} Budget`,
                category: category,
                month: monthNum,
                year: 2024,
                amount: budgetAmount,
                spent: spent,
                type: 'MONTHLY'
              }
            });
            
            console.log(`  💰 ${category}: Budget $${budgetAmount.toFixed(2)}, Spent $${spent.toFixed(2)}`);
            totalBudgetsCreated++;
          }
        }
        
        // Create income budgets
        for (const [category, received] of Object.entries(income)) {
          if (received > 0) {
            const budgetAmount = received * 0.90; // Expect 90% of actual
            
            await prisma.budget.upsert({
              where: {
                userId_businessProfileId_category_month_year: {
                  userId: user.id,
                  businessProfileId: profile.id,
                  category: category,
                  month: monthNum,
                  year: 2024
                }
              },
              update: {
                amount: budgetAmount,
                spent: received
              },
              create: {
                userId: user.id,
                businessProfileId: profile.id,
                name: `${category} Budget`,
                category: category,
                month: monthNum,
                year: 2024,
                amount: budgetAmount,
                spent: received,
                type: 'MONTHLY'
              }
            });
            
            console.log(`  💵 ${category}: Budget $${budgetAmount.toFixed(2)}, Received $${received.toFixed(2)}`);
            totalBudgetsCreated++;
          }
        }
      }
    }
    
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('✅ MONTHLY BUDGETS CREATED FOR ALL OF 2024');
    console.log('='.repeat(70));
    console.log(`\n📊 Total Budgets Created: ${totalBudgetsCreated}`);
    console.log('\n📍 How to View:');
    console.log('   1. Go to: Budget Planning page');
    console.log('   2. Select any month in 2024 (January - December)');
    console.log('   3. View budget vs actual spending for that month');
    console.log('\n🔗 https://cfo-budgeting-app-zgajgy.abacusai.app/dashboard/budget');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

create2024MonthlyBudgets();
