const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    // Get user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    console.log('✅ User:', user.email);
    
    // Get business profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id }
    });
    
    console.log('\n📊 Business Profiles:', profiles.length);
    profiles.forEach(p => console.log(`  - ${p.businessName} (${p.id})`));
    
    // Get debts
    const debts = await prisma.debt.findMany({
      where: { userId: user.id },
      include: {
        businessProfile: true
      }
    });
    
    console.log('\n💳 Debts:', debts.length);
    if (debts.length > 0) {
      debts.forEach(d => {
        console.log(`  - ${d.name}: $${d.balance} (${d.businessProfile?.businessName || 'Personal'})`);
      });
    }
    
    // Get credit scores
    const creditScores = await prisma.creditScore.findMany({
      where: { userId: user.id },
      include: {
        businessProfile: true
      },
      orderBy: { scoreDate: 'desc' }
    });
    
    console.log('\n📈 Credit Scores:', creditScores.length);
    if (creditScores.length > 0) {
      creditScores.forEach(cs => {
        console.log(`  - ${cs.score} (${cs.provider || 'N/A'}) - ${cs.scoreDate.toLocaleDateString()} - ${cs.businessProfile?.businessName || 'Personal'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
