const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateUserCredentials() {
  try {
    console.log('🔍 Checking current user...');
    
    // Check if old user exists
    const oldUser = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' },
      include: { businessProfiles: true }
    });

    if (oldUser) {
      console.log('✅ Found existing user:', oldUser.email);
      console.log('📋 Business profiles:', oldUser.businessProfiles.length);
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash('hunterrr777', 10);
      
      // Update the user's email and password
      const updatedUser = await prisma.user.update({
        where: { email: 'khouston721@gmail.com' },
        data: {
          email: 'khouston@thebasketballfactorynj.com',
          password: hashedPassword,
          name: 'K Houston'
        }
      });
      
      console.log('✅ User credentials updated successfully!');
      console.log('📧 New email:', updatedUser.email);
      console.log('🔑 Password updated: hunterrr777');
      
      // Verify the password
      const isValid = await bcrypt.compare('hunterrr777', updatedUser.password);
      console.log('✅ Password verification:', isValid ? 'PASSED' : 'FAILED');
      
      // Show business profiles
      const profiles = await prisma.businessProfile.findMany({
        where: { userId: updatedUser.id }
      });
      
      console.log('\n📊 Business Profiles:');
      profiles.forEach(profile => {
        console.log(`  - ${profile.name} (${profile.profileType})`);
      });
      
    } else {
      // Check if new email already exists
      const newUser = await prisma.user.findUnique({
        where: { email: 'khouston@thebasketballfactorynj.com' }
      });
      
      if (newUser) {
        console.log('⚠️ User with new email already exists');
        console.log('Updating password only...');
        
        const hashedPassword = await bcrypt.hash('hunterrr777', 10);
        await prisma.user.update({
          where: { email: 'khouston@thebasketballfactorynj.com' },
          data: { password: hashedPassword }
        });
        
        console.log('✅ Password updated successfully!');
      } else {
        console.log('❌ No user found with email: khouston721@gmail.com');
        console.log('Creating new user...');
        
        const hashedPassword = await bcrypt.hash('hunterrr777', 10);
        const newUser = await prisma.user.create({
          data: {
            email: 'khouston@thebasketballfactorynj.com',
            password: hashedPassword,
            name: 'K Houston',
            businessProfiles: {
              create: [
                {
                  name: 'Personal',
                  profileType: 'PERSONAL',
                  isDefault: true
                },
                {
                  name: 'Business',
                  profileType: 'BUSINESS',
                  isDefault: false
                }
              ]
            }
          }
        });
        
        console.log('✅ New user created successfully!');
        console.log('📧 Email:', newUser.email);
      }
    }
    
  } catch (error) {
    console.error('❌ Error updating credentials:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserCredentials();
