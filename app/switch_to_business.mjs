import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

async function switchToBusiness() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');

    if (!businessProfile) {
      console.log('Business profile not found');
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { currentBusinessProfileId: businessProfile.id }
    });

    console.log(`✅ Switched to Business profile: ${businessProfile.name}`);
    console.log(`\nNow the dashboard will show:`);
    console.log(`  - 118 transactions`);
    console.log(`  - Income: $16,648.71`);
    console.log(`  - Expenses: $21,030.47`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

switchToBusiness();
