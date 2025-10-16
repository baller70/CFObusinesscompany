const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function verifyLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Has password:', !!user.password);
    
    if (user.password) {
      const testPassword = 'UKNPonFiP9d4JI';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`\nPassword "${testPassword}" is ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.log('\n🔧 Updating password to: UKNPonFiP9d4JI');
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        await prisma.user.update({
          where: { email: 'khouston721@gmail.com' },
          data: { password: hashedPassword }
        });
        console.log('✅ Password updated successfully');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLogin();
