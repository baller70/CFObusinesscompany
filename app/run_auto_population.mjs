import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAutoPopulation() {
  try {
    console.log('🚀 Starting comprehensive auto-population...\n');
    
    // Get all business profiles
    const profiles = await prisma.businessProfile.findMany({
      include: {
        user: true,
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log(`📊 Found ${profiles.length} business profiles\n`);
    
    for (const profile of profiles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 Processing: ${profile.name} (${profile.profileType})`);
      console.log(`   User: ${profile.user.email}`);
      console.log(`${'='.repeat(60)}\n`);
      
      const transactionCount = profile._count.transactions;
      console.log(`💳 Found ${transactionCount} transactions\n`);
      
      if (transactionCount === 0) {
        console.log('⚠️  No transactions to process, skipping...\n');
        continue;
      }
      
      // Import and call the auto-populator directly
      console.log('🔄 Triggering feature auto-population...\n');
      const { autoPopulateAllFeatures } = await import('./lib/feature-auto-populator.ts');
      const results = await autoPopulateAllFeatures(profile.id, profile.userId);
      
      console.log('✅ Auto-population complete!\n');
      console.log('📈 Results:');
      console.log(JSON.stringify(results, null, 2));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL FEATURES POPULATED SUCCESSFULLY!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error during auto-population:', error);
    console.error('\nStack trace:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runAutoPopulation();
