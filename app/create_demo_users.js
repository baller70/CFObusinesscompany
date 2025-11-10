require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDemoUsers() {
  try {
    console.log('🔧 Creating demo users...\n');

    // Demo User 1: Personal Account
    const email1 = 'john.doe@example.com';
    const password1 = 'password123';
    const hashedPassword1 = await bcrypt.hash(password1, 10);

    const user1 = await prisma.user.upsert({
      where: { email: email1 },
      update: {
        password: hashedPassword1,
        name: 'John Doe'
      },
      create: {
        email: email1,
        password: hashedPassword1,
        name: 'John Doe'
      }
    });

    console.log('✅ Created/Updated Personal Account:');
    console.log(`   Email: ${email1}`);
    console.log(`   Password: ${password1}`);
    console.log(`   ID: ${user1.id}\n`);

    // Create Personal profile for user1
    const existingPersonalProfile = await prisma.businessProfile.findFirst({
      where: {
        userId: user1.id,
        name: 'Personal'
      }
    });

    if (!existingPersonalProfile) {
      await prisma.businessProfile.create({
        data: {
          userId: user1.id,
          name: 'Personal',
          type: 'PERSONAL',
          description: 'Personal finances',
          icon: '👤',
          color: '#3b82f6',
          isDefault: true,
          isActive: true
        }
      });
      console.log(`   ✅ Created Personal profile for John Doe\n`);
    } else {
      console.log(`   ✅ Personal profile already exists for John Doe\n`);
    }

    // Demo User 2: Business Account
    const email2 = 'sarah.smith@company.com';
    const password2 = 'password456';
    const hashedPassword2 = await bcrypt.hash(password2, 10);

    const user2 = await prisma.user.upsert({
      where: { email: email2 },
      update: {
        password: hashedPassword2,
        name: 'Sarah Smith'
      },
      create: {
        email: email2,
        password: hashedPassword2,
        name: 'Sarah Smith'
      }
    });

    console.log('✅ Created/Updated Business Account:');
    console.log(`   Email: ${email2}`);
    console.log(`   Password: ${password2}`);
    console.log(`   ID: ${user2.id}\n`);

    // Create Business profile for user2
    const existingBusinessProfile = await prisma.businessProfile.findFirst({
      where: {
        userId: user2.id,
        name: 'Acme Corp'
      }
    });

    if (!existingBusinessProfile) {
      await prisma.businessProfile.create({
        data: {
          userId: user2.id,
          name: 'Acme Corp',
          type: 'BUSINESS',
          description: 'Business finances',
          industry: 'Technology',
          icon: '🏢',
          color: '#10b981',
          isDefault: true,
          isActive: true
        }
      });
      console.log(`   ✅ Created Business profile for Sarah Smith\n`);
    } else {
      console.log(`   ✅ Business profile already exists for Sarah Smith\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('✨ DEMO USERS READY!\n');
    console.log('📝 Demo Credentials:');
    console.log('\n1️⃣  Personal Account:');
    console.log(`   📧 ${email1}`);
    console.log(`   🔑 ${password1}`);
    console.log('\n2️⃣  Business Account:');
    console.log(`   📧 ${email2}`);
    console.log(`   🔑 ${password2}`);
    console.log('\n✅ Both accounts are ready to use!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error creating demo users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers();
