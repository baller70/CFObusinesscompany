
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllData() {
  console.log('\n🔍 COMPREHENSIVE DATABASE CHECK\n');
  console.log('================================\n');
  
  // Get user and profiles
  const user = await prisma.user.findFirst({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    include: { businessProfiles: true }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log('👤 User:', user.email);
  console.log('📊 Business Profiles:', user.businessProfiles.length);
  user.businessProfiles.forEach(p => {
    console.log(`   - ${p.name} (${p.type})`);
  });
  
  // Check transactions
  const transactions = await prisma.transaction.count();
  console.log('\n💰 Total Transactions:', transactions);
  
  // Check each profile
  for (const profile of user.businessProfiles) {
    console.log(`\n📍 Profile: ${profile.name} (${profile.type})`);
    console.log('━'.repeat(60));
    
    const profileTransactions = await prisma.transaction.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Transactions: ${profileTransactions}`);
    
    // Check budgets
    const budgets = await prisma.budget.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Budgets: ${budgets}`);
    
    // Check goals
    const goals = await prisma.goal.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Goals: ${goals}`);
    
    // Check debts
    const debts = await prisma.debt.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Debts: ${debts}`);
    
    // Check recurring charges
    const recurring = await prisma.recurringCharge.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Recurring Charges: ${recurring}`);
    
    // Check invoices
    const invoices = await prisma.invoice.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Invoices: ${invoices}`);
    
    // Check customers
    const customers = await prisma.customer.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Customers: ${customers}`);
    
    // Check vendors
    const vendors = await prisma.vendor.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Vendors: ${vendors}`);
    
    // Check bills
    const bills = await prisma.bill.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Bills: ${bills}`);
    
    // Check categories
    const categories = await prisma.category.count({
      where: { businessProfileId: profile.id }
    });
    console.log(`   ✓ Categories: ${categories}`);
  }
  
  console.log('\n================================\n');
  
  await prisma.$disconnect();
}

checkAllData().catch(console.error);
