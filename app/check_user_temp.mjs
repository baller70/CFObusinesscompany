import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });
    
    if (user) {
      console.log('✅ User found in database');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Password hash exists:', !!user.password);
      console.log('Password hash length:', user.password ? user.password.length : 0);
      
      // Test password verification
      if (user.password) {
        const isValid = await bcrypt.compare('johndoe123', user.password);
        console.log('Password "johndoe123" is valid:', isValid);
      }
    } else {
      console.log('❌ User NOT found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
