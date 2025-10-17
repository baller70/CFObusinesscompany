const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserProfile() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' },
      include: {
        businessProfiles: {
          where: { isActive: true }
        }
      }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('=== USER INFO ===');
    console.log(`User ID: ${user.id}`);
    console.log(`Current Business Profile ID: ${user.currentBusinessProfileId}`);
    
    console.log('\n=== BUSINESS PROFILES ===');
    user.businessProfiles.forEach(p => {
      const isCurrent = p.id === user.currentBusinessProfileId;
      console.log(`${isCurrent ? '→' : ' '} ${p.name} (${p.type}) - ID: ${p.id}`);
    });

    // Test what the dashboard would show
    const businessProfileId = user.currentBusinessProfileId;
    const profileWhere = businessProfileId ? { businessProfileId } : {};
    
    console.log(`\n=== DASHBOARD WILL USE ===`);
    console.log(`Profile ID: ${businessProfileId || 'ALL PROFILES'}`);
    console.log(`Where clause:`, profileWhere);
    
    // Check September data with this profile
    const septFirst = new Date(2025, 8, 1);
    const septLast = new Date(2025, 8, 30);
    
    const septIncome = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        ...profileWhere,
        type: 'INCOME',
        date: { gte: septFirst, lte: septLast }
      },
      _sum: { amount: true },
      _count: true
    });
    
    const septExpense = await prisma.transaction.aggregate({
      where: {
        userId: user.id,
        ...profileWhere,
        type: 'EXPENSE',
        date: { gte: septFirst, lte: septLast }
      },
      _sum: { amount: true },
      _count: true
    });
    
    console.log(`\n=== SEPTEMBER 2025 DATA ===`);
    console.log(`Income: $${(septIncome._sum.amount || 0).toFixed(2)} (${septIncome._count} transactions)`);
    console.log(`Expenses: $${Math.abs(septExpense._sum.amount || 0).toFixed(2)} (${septExpense._count} transactions)`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserProfile();
