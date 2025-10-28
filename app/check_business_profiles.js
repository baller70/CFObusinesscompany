require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinessProfiles() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'john@acmecorp.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User ID:', user.id);
    
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id }
    });
    
    console.log('\nNumber of Business Profiles:', profiles.length);
    console.log('\nBusiness Profiles:');
    profiles.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}, Type: ${p.type})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessProfiles();
