import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

async function checkState() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`User: ${user.email}`);
    console.log(`Current Business Profile ID: ${user.currentBusinessProfileId}`);
    
    console.log(`\nAll profiles:`);
    user.businessProfiles.forEach(p => {
      const isCurrent = p.id === user.currentBusinessProfileId;
      console.log(`  ${isCurrent ? '👉' : '  '} ${p.name} (${p.type}) - ${p.id}`);
    });

    // Count transactions per profile
    console.log(`\nTransactions per profile:`);
    for (const profile of user.businessProfiles) {
      const count = await prisma.transaction.count({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        }
      });
      
      const income = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          businessProfileId: profile.id,
          type: 'INCOME'
        },
        _sum: { amount: true }
      });

      const expenses = await prisma.transaction.aggregate({
        where: {
          userId: user.id,
          businessProfileId: profile.id,
          type: 'EXPENSE'
        },
        _sum: { amount: true }
      });

      console.log(`  ${profile.name}:`);
      console.log(`    Transactions: ${count}`);
      console.log(`    Income: $${(income._sum.amount || 0).toFixed(2)}`);
      console.log(`    Expenses: $${(expenses._sum.amount || 0).toFixed(2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkState();
