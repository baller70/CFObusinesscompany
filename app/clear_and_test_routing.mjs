import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAndTest() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n=== CLEARING OLD DATA ===');
    
    // Delete all transactions for this user
    const deleted = await prisma.transaction.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${deleted.count} old transactions`);

    // Delete all bank statements
    const deletedStatements = await prisma.bankStatement.deleteMany({
      where: { userId: user.id }
    });
    console.log(`Deleted ${deletedStatements.count} old statements`);

    console.log('\n✅ Data cleared! Now upload your statement text again.\n');
    console.log('📋 NEXT STEPS:');
    console.log('1. Go to https://cfo-budgeting-app-zgajgy.abacusai.app/dashboard/bank-statements');
    console.log('2. Paste your statement text in the "OR PASTE STATEMENT TEXT" section');
    console.log('3. Click "Process Statement Text"');
    console.log('4. The AI will now classify transactions as BUSINESS or PERSONAL');
    console.log('5. Check both dashboards to see transactions routed correctly\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAndTest();
