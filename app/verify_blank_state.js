require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBlankState() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });

    console.log('\n📊 VERIFICATION REPORT - Blank State\n');
    console.log('═══════════════════════════════════════\n');

    const transactions = await prisma.transaction.count({ where: { userId: user.id } });
    const statements = await prisma.bankStatement.count({ where: { userId: user.id } });
    const budgets = await prisma.budget.count({ where: { userId: user.id } });
    const goals = await prisma.goal.count({ where: { userId: user.id } });
    const debts = await prisma.debt.count({ where: { userId: user.id } });
    const invoices = await prisma.invoice.count({ where: { userId: user.id } });
    const bills = await prisma.bill.count({ where: { userId: user.id } });
    const categories = await prisma.category.count({ where: { userId: user.id } });
    const recurringCharges = await prisma.recurringCharge.count({ where: { userId: user.id } });
    const investments = await prisma.investment.count({ where: { userId: user.id } });
    const profiles = await prisma.businessProfile.count({ where: { userId: user.id } });

    console.log(`📊 Transactions: ${transactions}`);
    console.log(`📄 Bank Statements: ${statements}`);
    console.log(`💰 Budgets: ${budgets}`);
    console.log(`🎯 Goals: ${goals}`);
    console.log(`💳 Debts: ${debts}`);
    console.log(`📝 Invoices: ${invoices}`);
    console.log(`🧾 Bills: ${bills}`);
    console.log(`📂 Categories: ${categories}`);
    console.log(`🔄 Recurring Charges: ${recurringCharges}`);
    console.log(`📈 Investments: ${investments}`);
    console.log(`🏢 Business Profiles: ${profiles}`);

    console.log('\n═══════════════════════════════════════');
    
    const allZero = 
      transactions === 0 &&
      statements === 0 &&
      budgets === 0 &&
      goals === 0 &&
      debts === 0 &&
      invoices === 0 &&
      bills === 0 &&
      categories === 0 &&
      recurringCharges === 0 &&
      investments === 0;

    if (allZero) {
      console.log('\n✅ SUCCESS! App is in COMPLETELY BLANK state');
      console.log('✅ All financial data is at zero');
      console.log('✅ Ready to upload your bank statements\n');
    } else {
      console.log('\n⚠️  Warning: Some data remains\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBlankState();
