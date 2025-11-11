import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function runFullPopulation() {
  console.log('\n🚀 Starting COMPREHENSIVE feature population...\n');
  
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`📊 Found user: ${user.email}`);
    console.log(`🏢 Business Profiles: ${user.businessProfiles.length}\n`);
    
    // Import the auto-populator
    const { autoPopulateAllFeatures } = await import('./lib/feature-auto-populator.js');
    
    // Run for each profile
    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing: ${profile.name} (${profile.type})`);
      console.log(`${'='.repeat(60)}\n`);
      
      const txCount = await prisma.transaction.count({
        where: { businessProfileId: profile.id }
      });
      
      console.log(`💰 Transactions found: ${txCount}`);
      
      if (txCount > 0) {
        await autoPopulateAllFeatures(user.id, profile.id);
      } else {
        console.log('⚠️  No transactions, skipping...');
      }
    }
    
    console.log('\n\n✅ COMPREHENSIVE POPULATION COMPLETE!\n');
    console.log('📊 Checking results...\n');
    
    // Show results
    for (const profile of user.businessProfiles) {
      console.log(`\n${profile.name} (${profile.type}):`);
      
      const counts = {
        transactions: await prisma.transaction.count({ where: { businessProfileId: profile.id } }),
        budgets: await prisma.budget.count({ where: { businessProfileId: profile.id } }),
        goals: await prisma.goal.count({ where: { businessProfileId: profile.id } }),
        debts: await prisma.debt.count({ where: { businessProfileId: profile.id } }),
        recurringCharges: await prisma.recurringCharge.count({ where: { businessProfileId: profile.id } }),
        invoices: await prisma.invoice.count({ where: { businessProfileId: profile.id } }),
        customers: await prisma.customer.count({ where: { businessProfileId: profile.id } }),
        vendors: await prisma.vendor.count({ where: { businessProfileId: profile.id } }),
        bills: await prisma.bill.count({ where: { businessProfileId: profile.id } }),
      };
      
      console.log(`  Transactions: ${counts.transactions}`);
      console.log(`  Budgets: ${counts.budgets}`);
      console.log(`  Goals: ${counts.goals}`);
      console.log(`  Debts: ${counts.debts}`);
      console.log(`  Recurring Charges: ${counts.recurringCharges}`);
      console.log(`  Invoices: ${counts.invoices}`);
      console.log(`  Customers: ${counts.customers}`);
      console.log(`  Vendors: ${counts.vendors}`);
      console.log(`  Bills: ${counts.bills}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

runFullPopulation();
