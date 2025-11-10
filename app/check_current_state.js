require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkState() {
  try {
    console.log('\n📊 Checking Current Database State...\n');
    
    // Check users
    const users = await prisma.user.findMany({
      include: {
        businessProfiles: true
      }
    });
    console.log(`👥 Users: ${users.length}`);
    users.forEach(u => console.log(`   - ${u.email} (${u.businessProfiles.length} profiles)`));
    
    // Check statements
    const statements = await prisma.bankStatement.count();
    console.log(`📄 Bank Statements: ${statements}`);
    
    // Check transactions
    const transactions = await prisma.transaction.count();
    console.log(`💰 Transactions: ${transactions}`);
    
    // Check budgets
    const budgets = await prisma.budget.count();
    console.log(`📊 Budgets: ${budgets}`);
    
    // Check debts
    const debts = await prisma.debt.count();
    console.log(`💳 Debts: ${debts}`);
    
    console.log('\n✅ State check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkState();
