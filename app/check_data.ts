import { prisma } from './lib/db';

async function checkData() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User:', user.email);
    
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id }
    });
    
    console.log('\nProfiles:', profiles.map(p => p.name));
    
    const [recurring, debts, transactions] = await Promise.all([
      prisma.recurringCharge.count({ where: { userId: user.id } }),
      prisma.debt.count({ where: { userId: user.id } }),
      prisma.transaction.count({ where: { userId: user.id } })
    ]);
    
    console.log('\nFinancial Data:');
    console.log('- Recurring Charges:', recurring);
    console.log('- Debts:', debts);
    console.log('- Transactions:', transactions);
    
    const scores = await prisma.creditScore.count({ where: { userId: user.id } });
    console.log('- Credit Scores:', scores);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
