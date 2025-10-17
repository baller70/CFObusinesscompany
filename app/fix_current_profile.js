const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setCurrentProfile() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    // Get business profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id, isActive: true }
    });

    console.log('Current profiles:');
    profiles.forEach(p => {
      console.log(`  ${p.name} (${p.type})`);
    });

    // Set the Personal/Household profile as current
    const personalProfile = profiles.find(p => p.type === 'PERSONAL');
    
    if (personalProfile) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentBusinessProfileId: personalProfile.id }
      });

      console.log(`\n✓ Set "${personalProfile.name}" as the current profile`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setCurrentProfile();
