const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactionProfiles() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 20
    });

    console.log('=== ALL TRANSACTIONS ===');
    console.log(`Total: ${transactions.length}\n`);
    
    // Group by profile
    const byProfile = {};
    transactions.forEach(t => {
      const profileId = t.businessProfileId || 'NO_PROFILE';
      if (!byProfile[profileId]) {
        byProfile[profileId] = [];
      }
      byProfile[profileId].push(t);
    });

    Object.keys(byProfile).forEach(profileId => {
      console.log(`\n${profileId === 'NO_PROFILE' ? 'NO PROFILE ASSIGNED' : `Profile: ${profileId}`}`);
      console.log(`Count: ${byProfile[profileId].length}`);
      console.log('Sample transactions:');
      byProfile[profileId].slice(0, 3).forEach(t => {
        console.log(`  ${new Date(t.date).toISOString().split('T')[0]} - ${t.description} - ${t.type} - $${t.amount}`);
      });
    });

    console.log('\n=== RECOMMENDATION ===');
    if (byProfile['NO_PROFILE'] && byProfile['NO_PROFILE'].length > 0) {
      console.log('Some transactions have no businessProfileId assigned.');
      console.log('The dashboard will only show transactions assigned to the current profile.');
      console.log('You need to either:');
      console.log('  1. Assign these transactions to a profile');
      console.log('  2. Change the dashboard to show all transactions when a profile is selected');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionProfiles();
