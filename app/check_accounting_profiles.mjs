import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    console.log('\n=== USER INFO ===');
    console.log(`User ID: ${user.id}`);
    console.log(`Current Business Profile ID: ${user.currentBusinessProfileId}`);
    console.log('\n=== BUSINESS PROFILES ===');
    user.businessProfiles.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}, Type: ${p.type}`);
    });

    // Check which profiles have chart of accounts
    console.log('\n=== CHART OF ACCOUNTS BY PROFILE ===');
    for (const profile of user.businessProfiles) {
      const count = await prisma.chartOfAccount.count({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        }
      });
      console.log(`${profile.name}: ${count} accounts`);
    }

    // Check accounts with null businessProfileId
    const nullProfileCount = await prisma.chartOfAccount.count({
      where: { 
        userId: user.id,
        businessProfileId: null
      }
    });
    console.log(`NULL profile: ${nullProfileCount} accounts`);

    // Check journal entries by profile
    console.log('\n=== JOURNAL ENTRIES BY PROFILE ===');
    for (const profile of user.businessProfiles) {
      const count = await prisma.journalEntry.count({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        }
      });
      console.log(`${profile.name}: ${count} entries`);
    }

    // Check entries with null businessProfileId
    const nullJournalCount = await prisma.journalEntry.count({
      where: { 
        userId: user.id,
        businessProfileId: null
      }
    });
    console.log(`NULL profile: ${nullJournalCount} entries`);

    // Check reconciliations by profile
    console.log('\n=== RECONCILIATIONS BY PROFILE ===');
    for (const profile of user.businessProfiles) {
      const count = await prisma.reconciliation.count({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        }
      });
      console.log(`${profile.name}: ${count} reconciliations`);
    }

    const nullReconCount = await prisma.reconciliation.count({
      where: { 
        userId: user.id,
        businessProfileId: null
      }
    });
    console.log(`NULL profile: ${nullReconCount} reconciliations`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles();
