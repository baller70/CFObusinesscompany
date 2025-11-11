import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runComprehensivePopulation() {
  try {
    console.log('🚀 Starting COMPREHENSIVE feature population for ALL profiles...\n');
    
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!user) {
      console.error('❌ User not found');
      return;
    }

    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    console.log(`📊 Found ${profiles.length} profiles to populate\n`);

    for (const profile of profiles) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📁 Processing: ${profile.name} (${profile.type})`);
      console.log(`   Transactions: ${profile._count.transactions}`);
      console.log(`${'='.repeat(70)}\n`);

      if (profile._count.transactions === 0) {
        console.log('⚠️  No transactions, skipping...\n');
        continue;
      }

      // Import the auto-populator
      const { autoPopulateAllFeatures } = await import('./lib/feature-auto-populator.ts');
      
      // Run auto-population
      console.log('🔄 Running comprehensive feature auto-population...\n');
      await autoPopulateAllFeatures(profile.id, user.id);
      
      console.log('\n✅ Population complete for this profile!\n');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL PROFILES POPULATED SUCCESSFULLY!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

runComprehensivePopulation();
