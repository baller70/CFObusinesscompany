const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            budgets: true,
            bankStatements: true
          }
        }
      }
    });
    
    console.log(`Total users in database: ${users.length}\n`);
    
    users.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`  Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`  Transactions: ${user._count.transactions}`);
      console.log(`  Budgets: ${user._count.budgets}`);
      console.log(`  Bank Statements: ${user._count.bankStatements}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllUsers();
