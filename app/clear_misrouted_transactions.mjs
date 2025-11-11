import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function clearMisroutedTransactions() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    console.log(`\n👤 User: ${user.email}`);
    console.log(`📊 Current transaction count: ${await prisma.transaction.count({ where: { userId: user.id } })}`);
    
    // Get counts by profile
    for (const profile of user.businessProfiles) {
      const count = await prisma.transaction.count({
        where: { businessProfileId: profile.id }
      });
      console.log(`  - ${profile.name} (${profile.type}): ${count} transactions`);
    }

    // Delete all transactions for this user
    const deleted = await prisma.transaction.deleteMany({
      where: { userId: user.id }
    });

    console.log(`\n✅ Deleted ${deleted.count} transactions`);
    console.log(`\n🎯 Ready for fresh data! You can now:`);
    console.log(`   1. Go to Bank Statements page`);
    console.log(`   2. Paste your January transactions`);
    console.log(`   3. Create transaction card`);
    console.log(`   4. Click "Load to Database"`);
    console.log(`   5. AI will automatically classify as Business/Personal`);
    console.log(`   6. Check both profile dashboards to see the split!\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearMisroutedTransactions();
