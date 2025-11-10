const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    
    const isValid = await bcrypt.compare('hunterrr777', user.password);
    console.log('🔑 Password test:', isValid ? '✅ VALID' : '❌ INVALID');
    
    console.log('\n📊 Business Profiles:');
    user.businessProfiles.forEach(profile => {
      console.log(`  - ${profile.name} (Type: ${profile.profileType || 'N/A'}, Default: ${profile.isDefault})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLogin();
