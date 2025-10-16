const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        businessProfiles: true
      }
    });

    console.log(`Found ${users.length} users\n`);
    
    for (const user of users) {
      console.log('=== USER ===');
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Current Business Profile ID: ${user.currentBusinessProfileId}`);
      console.log(`Business Profiles: ${user.businessProfiles.length}`);
      
      if (user.businessProfiles.length > 0) {
        console.log('\nProfiles:');
        for (const profile of user.businessProfiles) {
          console.log(`  - ${profile.name} (${profile.type}) - Active: ${profile.isActive}`);
        }
      }
      console.log('\n---\n');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
