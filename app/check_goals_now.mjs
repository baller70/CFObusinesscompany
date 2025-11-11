import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGoals() {
  try {
    console.log('\n🔍 CHECKING FINANCIAL GOALS...\n');
    
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: true
      }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('📧 User:', user.email);
    console.log('🏢 Business Profiles:', user.businessProfiles.map(p => `${p.name} (${p.id})`).join(', '));
    console.log('🎯 Current Profile ID:', user.currentBusinessProfileId);
    
    // Get all goals
    const allGoals = await prisma.goal.findMany({
      include: {
        businessProfile: true
      }
    });
    
    console.log('\n📊 TOTAL GOALS IN DATABASE:', allGoals.length);
    
    if (allGoals.length > 0) {
      console.log('\n📝 GOALS BREAKDOWN:');
      for (const goal of allGoals) {
        console.log(`  - ${goal.name}`);
        console.log(`    Profile: ${goal.businessProfile.name} (${goal.businessProfileId})`);
        console.log(`    Target: $${goal.targetAmount}`);
        console.log(`    Current: $${goal.currentAmount}`);
        console.log(`    Deadline: ${goal.targetDate}`);
        console.log(`    Status: ${goal.status}`);
        console.log('');
      }
    } else {
      console.log('\n❌ NO GOALS FOUND IN DATABASE!\n');
    }
    
    // Check transactions to see if we have data to create goals
    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    
    if (businessProfile) {
      const bizTransactions = await prisma.transaction.count({
        where: { businessProfileId: businessProfile.id }
      });
      console.log(`📈 Business Transactions: ${bizTransactions}`);
    }
    
    if (personalProfile) {
      const persTransactions = await prisma.transaction.count({
        where: { businessProfileId: personalProfile.id }
      });
      console.log(`🏠 Personal Transactions: ${persTransactions}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkGoals();
