import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRouting() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== USER INFO ===');
    console.log('Email:', user.email);
    console.log('Current Profile ID:', user.currentBusinessProfileId);

    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id }
    });

    console.log('\n=== BUSINESS PROFILES ===');
    profiles.forEach(p => {
      console.log(`- ${p.name} (${p.type}) - ID: ${p.id}`);
    });

    console.log('\n=== TRANSACTION DISTRIBUTION ===');
    for (const profile of profiles) {
      const count = await prisma.transaction.count({
        where: { businessProfileId: profile.id }
      });
      
      const sampleTxns = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        take: 5,
        orderBy: { date: 'desc' },
        select: {
          description: true,
          amount: true,
          category: true,
          type: true
        }
      });

      console.log(`\n${profile.name} (${profile.type}): ${count} transactions`);
      if (sampleTxns.length > 0) {
        console.log('Sample transactions:');
        sampleTxns.forEach(t => {
          console.log(`  - ${t.description} | $${t.amount} | ${t.category} | ${t.type}`);
        });
      }
    }

    const noProfile = await prisma.transaction.count({
      where: { businessProfileId: null }
    });
    console.log(`\nTransactions with NO profile: ${noProfile}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRouting();
