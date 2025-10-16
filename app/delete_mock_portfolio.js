const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteMockData() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('🗑️  Removing mock/seed data for user:', user.email);
    console.log('');
    
    // Delete portfolios
    const deletedPortfolios = await prisma.portfolio.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ Deleted ${deletedPortfolios.count} portfolio(s)`);
    
    // Delete investments
    const deletedInvestments = await prisma.investment.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ Deleted ${deletedInvestments.count} investment(s)`);
    
    // Delete investment assets
    const deletedAssets = await prisma.asset.deleteMany({
      where: { userId: user.id, type: 'INVESTMENT' }
    });
    console.log(`✅ Deleted ${deletedAssets.count} investment asset(s)`);
    
    // Delete retirement accounts
    const deletedRetirement = await prisma.retirementAccount.deleteMany({
      where: { userId: user.id }
    });
    console.log(`✅ Deleted ${deletedRetirement.count} retirement account(s)`);
    
    console.log('\n✨ All mock/seed investment and retirement data removed!');
    console.log('You can now add your real investment and retirement accounts.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMockData();
