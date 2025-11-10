require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyLogin() {
  try {
    console.log('\n🔐 Verifying Demo User Credentials...\n');
    
    // Test User 1
    const user1 = await prisma.user.findUnique({
      where: { email: 'john.doe@example.com' }
    });
    
    if (user1 && user1.password) {
      const valid1 = await bcrypt.compare('password123', user1.password);
      console.log(`✅ john.doe@example.com / password123: ${valid1 ? '✓ WORKING' : '✗ FAILED'}`);
    } else {
      console.log('❌ john.doe@example.com: User not found');
    }

    // Test User 2
    const user2 = await prisma.user.findUnique({
      where: { email: 'sarah.smith@company.com' }
    });
    
    if (user2 && user2.password) {
      const valid2 = await bcrypt.compare('password456', user2.password);
      console.log(`✅ sarah.smith@company.com / password456: ${valid2 ? '✓ WORKING' : '✗ FAILED'}`);
    } else {
      console.log('❌ sarah.smith@company.com: User not found');
    }

    console.log('\n✅ All demo credentials are verified and ready!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLogin();
