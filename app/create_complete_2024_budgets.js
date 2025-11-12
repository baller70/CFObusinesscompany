require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCompleteBudgets() {
  try {
    console.log('🚀 Starting Budget Creation for 2024...\n');
    
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User: ${user.email}`);
    console.log(`✅ Profiles: ${user.businessProfiles.map(p => p.name).join(', ')}\n`);
    
    // Step 1: Delete existing 2024 budgets
    console.log('🗑️  Deleting existing 2024 budgets...');
    const deleted = await prisma.budget.deleteMany({
      where: {
        userId: user.id,
        year: 2024
      }
    });
    console.log(`   Deleted ${deleted.count} existing 2024 budgets\n`);
    
    // Step 2: Fetch all 2024 transactions
    console.log('📊 Fetching 2024 transactions...');
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date('2024-01-01'),
          lte: new Date('2024-12-31')
        }
      },
      include: {
        businessProfile: true
      }
    });
    
    console.log(`   Found ${transactions.length} transactions\n`);
    
    // Step 3: Group by month, category, and profile
    const budgetData = {};
    
    transactions.forEach(t => {
      const month = t.date.getMonth() + 1;
      const category = t.category;
      const profileId = t.businessProfileId;
      const key = `${month}|${category}|${profileId}`;
      
      if (!budgetData[key]) {
        budgetData[key] = {
          month,
          category,
          businessProfileId: profileId,
          businessProfile: t.businessProfile,
          transactions: [],
          type: t.type
        };
      }
      
      budgetData[key].transactions.push(t);
    });
    
    console.log(`📋 Creating budgets for ${Object.keys(budgetData).length} unique month/category/profile combinations...\n`);
    
    // Step 4: Create budgets
    let created = 0;
    let skipped = 0;
    
    for (const [key, data] of Object.entries(budgetData)) {
      const { month, category, businessProfileId, transactions, type, businessProfile } = data;
      
      // Calculate total spending/income for this category in this month
      const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Set budget amount based on type
      let budgetAmount;
      if (type === 'INCOME') {
        // For income, set budget at 90% of actual (conservative estimate)
        budgetAmount = totalAmount * 0.9;
      } else {
        // For expenses, set budget at 110% of actual (with buffer)
        budgetAmount = totalAmount * 1.1;
      }
      
      // Ensure minimum budget of $100
      if (budgetAmount < 100) budgetAmount = 100;
      
      try {
        await prisma.budget.upsert({
          where: {
            userId_businessProfileId_category_month_year: {
              userId: user.id,
              businessProfileId: businessProfileId,
              category: category,
              month: month,
              year: 2024
            }
          },
          update: {
            amount: budgetAmount,
            spent: totalAmount,
            type: 'MONTHLY'
          },
          create: {
            userId: user.id,
            businessProfileId: businessProfileId,
            category: category,
            month: month,
            year: 2024,
            amount: budgetAmount,
            spent: totalAmount,
            type: 'MONTHLY'
          }
        });
        
        created++;
        
        if (created <= 15) {
          console.log(`✅ ${month}/2024 - ${category} (${businessProfile.name})`);
          console.log(`   Budget: $${budgetAmount.toFixed(2)} | Spent: $${totalAmount.toFixed(2)} | Type: ${type}`);
        } else if (created === 16) {
          console.log('\n   ... (creating remaining budgets) ...\n');
        }
        
      } catch (error) {
        console.log(`❌ Error creating budget for ${category} in month ${month}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\n🎉 BUDGET CREATION COMPLETE!`);
    console.log(`   ✅ Created/Updated: ${created} budgets`);
    console.log(`   ❌ Skipped: ${skipped} budgets`);
    
    // Summary by month
    const budgetsByMonth = await prisma.budget.findMany({
      where: {
        userId: user.id,
        year: 2024
      },
      select: {
        month: true
      }
    });
    
    const monthCounts = {};
    budgetsByMonth.forEach(b => {
      monthCounts[b.month] = (monthCounts[b.month] || 0) + 1;
    });
    
    console.log(`\n📅 MONTHLY BUDGET DISTRIBUTION:`);
    for (let m = 1; m <= 12; m++) {
      console.log(`   ${m}/2024: ${monthCounts[m] || 0} budgets`);
    }
    
    console.log(`\n✨ All 2024 budgets are now populated!`);
    console.log(`\n🔗 View them at: https://cfo-budgeting-app-zgajgy.abacusai.app/dashboard/budget`);
    console.log(`   💡 Use the month/year selector to navigate through 2024`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteBudgets();
