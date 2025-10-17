const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixProfile() {
  try {
    // Get the user
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
      console.log(`  ${p.name} - isCurrent: ${p.isCurrent}`);
    });

    // Set "Personal/Household" as the current profile
    const personalProfile = profiles.find(p => p.type === 'PERSONAL');
    
    if (personalProfile) {
      // First, set all profiles to not current
      await prisma.businessProfile.updateMany({
        where: { userId: user.id },
        data: { isCurrent: false }
      });

      // Then set the personal profile as current
      await prisma.businessProfile.update({
        where: { id: personalProfile.id },
        data: { isCurrent: true }
      });

      console.log(`\n✓ Set "${personalProfile.name}" as the current profile`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProfile();
