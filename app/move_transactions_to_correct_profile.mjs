import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveTransactions() {
  console.log('\n=== MOVING TRANSACTIONS TO CORRECT PROFILE ===\n');
  
  const user = await prisma.user.findUnique({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    select: { id: true, currentBusinessProfileId: true },
  });

  if (!user || !user.currentBusinessProfileId) {
    console.log('❌ User or currentBusinessProfileId not found');
    return;
  }

  const targetProfileId = user.currentBusinessProfileId;
  console.log(`Target Profile ID: ${targetProfileId}`);

  // Move all transactions to the current profile
  const updateResult = await prisma.transaction.updateMany({
    where: {
      userId: user.id,
      businessProfileId: { not: targetProfileId },
    },
    data: {
      businessProfileId: targetProfileId,
    },
  });

  console.log(`✅ Moved ${updateResult.count} transactions to current profile`);

  // Also move the bank statement
  const statementResult = await prisma.bankStatement.updateMany({
    where: {
      userId: user.id,
      businessProfileId: { not: targetProfileId },
    },
    data: {
      businessProfileId: targetProfileId,
    },
  });

  console.log(`✅ Moved ${statementResult.count} bank statement(s) to current profile`);

  // Verify
  const transactionCount = await prisma.transaction.count({
    where: {
      userId: user.id,
      businessProfileId: targetProfileId,
    },
  });

  console.log(`\n📊 Verification: ${transactionCount} transactions now in current profile`);

  await prisma.$disconnect();
}

moveTransactions().catch(console.error);
