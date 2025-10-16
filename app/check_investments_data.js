const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('=== USER:', user.email, '===\n');
    
    // Check investments
    const investments = await prisma.investment.findMany({
      where: { userId: user.id }
    });
    console.log(`📊 Investments: ${investments.length}`);
    if (investments.length > 0) {
      investments.forEach(inv => console.log(`   - ${inv.name}: $${inv.currentValue}`));
    }
    
    // Check portfolios
    const portfolios = await prisma.portfolio.findMany({
      where: { userId: user.id }
    });
    console.log(`\n💼 Portfolios: ${portfolios.length}`);
    if (portfolios.length > 0) {
      portfolios.forEach(p => console.log(`   - ${p.name}: $${p.totalValue}`));
    }
    
    // Check retirement accounts
    const retirementAccounts = await prisma.retirementAccount.findMany({
      where: { userId: user.id }
    });
    console.log(`\n🏦 Retirement Accounts: ${retirementAccounts.length}`);
    if (retirementAccounts.length > 0) {
      retirementAccounts.forEach(acc => console.log(`   - ${acc.accountName}: $${acc.currentBalance}`));
    }
    
    // Check assets
    const assets = await prisma.asset.findMany({
      where: { userId: user.id, type: 'INVESTMENT' }
    });
    console.log(`\n💰 Investment Assets: ${assets.length}`);
    if (assets.length > 0) {
      assets.forEach(asset => console.log(`   - ${asset.name}: $${asset.value}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
