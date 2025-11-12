import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function verify() {
  const user = await prisma.user.findUnique({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    include: { businessProfiles: true }
  });

  const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
  
  console.log('\n=== BUSINESS PROFILE ===');
  console.log(`ID: ${businessProfile.id}`);
  console.log(`Name: ${businessProfile.name}`);
  console.log(`Current Profile ID: ${user.currentBusinessProfileId}`);
  console.log(`Match: ${businessProfile.id === user.currentBusinessProfileId}`);

  // Get accounts for this specific ID
  const accounts = await prisma.chartOfAccount.findMany({
    where: {
      userId: user.id,
      businessProfileId: businessProfile.id
    }
  });

  console.log(`\nAccounts found: ${accounts.length}`);
  accounts.slice(0, 5).forEach(a => {
    console.log(`- ${a.code}: ${a.name} (${a.type}) - Balance: $${a.balance}`);
  });

  // Sample a few accounts to verify
  if (accounts.length > 0) {
    const sample = accounts[0];
    console.log('\n=== SAMPLE ACCOUNT ===');
    console.log(JSON.stringify(sample, null, 2));
  }

  await prisma.$disconnect();
}

verify();
