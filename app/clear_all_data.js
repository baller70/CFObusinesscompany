require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('\n🧹 Clearing all financial data...\n');
    
    // Delete all financial data in the correct order (respecting foreign key constraints)
    const results = {};
    
    results.transactionReviews = await prisma.transactionReview.deleteMany({});
    results.merchantRules = await prisma.merchantRule.deleteMany({});
    results.transactions = await prisma.transaction.deleteMany({});
    results.budgets = await prisma.budget.deleteMany({});
    results.debts = await prisma.debt.deleteMany({});
    results.goals = await prisma.goal.deleteMany({});
    results.recurringCharges = await prisma.recurringCharge.deleteMany({});
    results.bankStatements = await prisma.bankStatement.deleteMany({});
    results.invoices = await prisma.invoice.deleteMany({});
    results.bills = await prisma.bill.deleteMany({});
    results.customers = await prisma.customer.deleteMany({});
    results.vendors = await prisma.vendor.deleteMany({});
    
    console.log('✅ Deletion Results:');
    Object.entries(results).forEach(([key, value]) => {
      console.log(`   ${key}: ${value.count} deleted`);
    });
    
    // Verify everything is cleared
    const transactionCount = await prisma.transaction.count();
    const budgetCount = await prisma.budget.count();
    const debtCount = await prisma.debt.count();
    const statementCount = await prisma.bankStatement.count();
    
    console.log('\n📊 Final State:');
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Budgets: ${budgetCount}`);
    console.log(`   Debts: ${debtCount}`);
    console.log(`   Bank Statements: ${statementCount}`);
    
    if (transactionCount === 0 && budgetCount === 0 && debtCount === 0 && statementCount === 0) {
      console.log('\n✅ All data cleared successfully! App is now at zero state.');
    } else {
      console.log('\n⚠️ Warning: Some data may still remain.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
