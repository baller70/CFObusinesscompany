
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetToBlankState() {
  try {
    console.log('🧹 Starting complete data reset...\n');

    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);

    // Delete all financial data in correct order (respecting foreign key constraints)
    
    console.log('\n📊 Deleting Transactions...');
    const transactions = await prisma.transaction.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${transactions.count} transactions`);

    console.log('\n📄 Deleting Bank Statements...');
    const statements = await prisma.bankStatement.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${statements.count} bank statements`);

    console.log('\n📋 Deleting Transaction Reviews...');
    const reviews = await prisma.transactionReview.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${reviews.count} transaction reviews`);

    console.log('\n🏪 Deleting Merchant Rules...');
    const merchantRules = await prisma.merchantRule.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${merchantRules.count} merchant rules`);

    console.log('\n🔄 Deleting User Corrections...');
    const userCorrections = await prisma.userCorrection.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${userCorrections.count} user corrections`);

    console.log('\n📊 Deleting Recurring Patterns...');
    const recurringPatterns = await prisma.recurringPattern.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${recurringPatterns.count} recurring patterns`);

    console.log('\n💰 Deleting Budgets...');
    const budgets = await prisma.budget.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${budgets.count} budgets`);

    console.log('\n🎯 Deleting Goals...');
    const goals = await prisma.goal.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${goals.count} goals`);

    console.log('\n📈 Deleting Investments...');
    const investments = await prisma.investment.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${investments.count} investments`);

    console.log('\n💳 Deleting Debts...');
    const debts = await prisma.debt.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${debts.count} debts`);

    console.log('\n📝 Deleting Invoices...');
    const invoices = await prisma.invoice.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${invoices.count} invoices`);

    console.log('\n🧾 Deleting Bills...');
    const bills = await prisma.bill.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${bills.count} bills`);

    console.log('\n🔄 Deleting Recurring Charges...');
    const recurringCharges = await prisma.recurringCharge.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${recurringCharges.count} recurring charges`);

    console.log('\n👥 Deleting Customers...');
    const customers = await prisma.customer.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${customers.count} customers`);

    console.log('\n🏢 Deleting Vendors...');
    const vendors = await prisma.vendor.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${vendors.count} vendors`);

    console.log('\n📂 Deleting Categories...');
    const categories = await prisma.category.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${categories.count} categories`);

    console.log('\n✅ Deleting Tasks...');
    const tasks = await prisma.task.deleteMany({
      where: { userId: user.id }
    });
    console.log(`   Deleted ${tasks.count} tasks`);

    console.log('\n🏢 Business Profiles kept intact (metadata only)');
    const profileCount = await prisma.businessProfile.count({
      where: { userId: user.id }
    });
    console.log(`   Found ${profileCount} business profile(s)`);

    console.log('\n🏠 Personal Profile kept intact (metadata only)');
    console.log(`   User: ${user.email}`);

    console.log('\n✨ COMPLETE! App is now in blank state.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ User account preserved: ${user.email}`);
    console.log('✅ All financial data cleared');
    console.log('✅ All transactions deleted');
    console.log('✅ All budgets, goals, debts deleted');
    console.log('✅ All invoices, bills, recurring charges deleted');
    console.log('✅ All categories deleted');
    console.log('\n🎯 Ready to test with your bank statements!\n');

  } catch (error) {
    console.error('❌ Error during reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetToBlankState();
