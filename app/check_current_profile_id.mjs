import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentProfileId() {
  const user = await prisma.user.findUnique({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    select: { 
      currentBusinessProfileId: true,
      businessProfiles: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  console.log('\n=== CURRENT PROFILE CHECK ===\n');
  console.log(`currentBusinessProfileId: ${user.currentBusinessProfileId || 'NOT SET'}`);
  console.log(`\nAll Profiles (in order created):`);
  user.businessProfiles.forEach((profile, idx) => {
    console.log(`  ${idx + 1}. ${profile.name} (${profile.id})`);
    console.log(`     Active: ${profile.isActive}`);
    console.log(`     Created: ${profile.createdAt}`);
  });

  await prisma.$disconnect();
}

checkCurrentProfileId().catch(console.error);
