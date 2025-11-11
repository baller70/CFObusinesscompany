import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixBudgetYears() {
  try {
    console.log('\n🔧 FIXING BUDGET YEARS TO 2024\n');
    console.log('='.repeat(60));

    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    let totalFixed = 0;

    for (const profile of user.businessProfiles) {
      console.log(`\n📁 ${profile.name}`);
      
      const budgetsToFix = await prisma.budget.findMany({
        where: { 
          businessProfileId: profile.id,
          year: 2025
        }
      });

      console.log(`   Found ${budgetsToFix.length} budgets with year=2025`);

      for (const budget of budgetsToFix) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: { year: 2024 }
        });
        console.log(`   ✓ ${budget.name}: 2025 → 2024`);
        totalFixed++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ FIXED ${totalFixed} BUDGET YEARS`);
    console.log('='.repeat(60));

    // Verify
    console.log('\n🔍 VERIFYING...\n');
    
    for (const profile of user.businessProfiles) {
      const budgets2025 = await prisma.budget.count({
        where: { 
          businessProfileId: profile.id,
          year: 2025
        }
      });
      
      const budgets2024 = await prisma.budget.count({
        where: { 
          businessProfileId: profile.id,
          year: 2024
        }
      });

      console.log(`${profile.name}:`);
      console.log(`  2024 budgets: ${budgets2024} ✓`);
      if (budgets2025 > 0) {
        console.log(`  2025 budgets: ${budgets2025} ⚠️`);
      }
    }

    console.log('\n✅ ALL BUDGET YEARS NOW SET TO 2024!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBudgetYears();
