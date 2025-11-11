import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoutingIssue() {
  console.log('\n=== ROUTING INVESTIGATION ===\n');
  
  // 1. Check the user and their profiles
  const user = await prisma.user.findUnique({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    include: {
      businessProfiles: true,
    },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log(`✅ User found: ${user.email}`);
  console.log(`\n📊 Business Profiles:`);
  user.businessProfiles.forEach((profile) => {
    console.log(`  - ${profile.name} (ID: ${profile.id})`);
    console.log(`    Type: ${profile.type}`);
    console.log(`    Active: ${profile.isActive}`);
  });

  const activeProfile = user.businessProfiles.find(p => p.isActive);
  console.log(`\n🎯 Active Profile: ${activeProfile?.name || 'NONE'} (${activeProfile?.id || 'N/A'})`);

  // 2. Check the most recent bank statement
  const recentStatement = await prisma.bankStatement.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (!recentStatement) {
    console.log('\n❌ No bank statements found for this user');
    return;
  }

  console.log(`\n📄 Most Recent Statement:`);
  console.log(`  File: ${recentStatement.fileName}`);
  console.log(`  Status: ${recentStatement.status}`);
  console.log(`  Transaction Count: ${recentStatement.transactionCount || 0}`);
  console.log(`  Business Profile ID: ${recentStatement.businessProfileId}`);
  console.log(`  Created: ${recentStatement.createdAt}`);

  // 3. Check transactions linked to this statement
  const statementTransactions = await prisma.transaction.findMany({
    where: { bankStatementId: recentStatement.id },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      type: true,
      businessProfileId: true,
    },
    take: 5,
  });

  console.log(`\n💰 Transactions for Statement (${recentStatement.id}):`);
  console.log(`  Total Count: ${statementTransactions.length}`);
  if (statementTransactions.length > 0) {
    console.log(`  Sample transactions:`);
    statementTransactions.slice(0, 3).forEach((t, idx) => {
      console.log(`    ${idx + 1}. ${t.date.toLocaleDateString()} - ${t.description} - $${t.amount} (${t.type})`);
      console.log(`       Profile ID: ${t.businessProfileId}`);
    });
  }

  // 4. Check ALL transactions for the user by profile
  const allTransactionsByProfile = await prisma.transaction.groupBy({
    by: ['businessProfileId', 'type'],
    where: { userId: user.id },
    _count: true,
    _sum: { amount: true },
  });

  console.log(`\n📈 All Transactions Grouped by Profile:`);
  allTransactionsByProfile.forEach((group) => {
    console.log(`  Profile ${group.businessProfileId}:`);
    console.log(`    Type: ${group.type}`);
    console.log(`    Count: ${group._count}`);
    console.log(`    Total: $${group._sum.amount || 0}`);
  });

  // 5. Check what the dashboard would query (active profile)
  if (activeProfile) {
    const dashboardTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        businessProfileId: activeProfile.id,
      },
      select: {
        type: true,
        amount: true,
      },
    });

    console.log(`\n🎯 Dashboard Query (Active Profile: ${activeProfile.name}):`);
    console.log(`  Total Transactions: ${dashboardTransactions.length}`);
    
    const income = dashboardTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dashboardTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    console.log(`  Total Income: $${income.toFixed(2)}`);
    console.log(`  Total Expenses: $${expenses.toFixed(2)}`);
  }

  // 6. THE KEY QUESTION: Are statement and transactions using different profiles?
  console.log(`\n🔍 ROUTING CHECK:`);
  const mismatch = recentStatement.businessProfileId !== activeProfile?.id;
  if (mismatch) {
    console.log(`  ❌ MISMATCH DETECTED!`);
    console.log(`     Statement saved to profile: ${recentStatement.businessProfileId}`);
    console.log(`     User viewing profile: ${activeProfile?.id}`);
    console.log(`     This is why dashboard shows zero!`);
  } else {
    console.log(`  ✅ Profile IDs match`);
    console.log(`     Both statement and active profile use: ${activeProfile?.id}`);
  }

  await prisma.$disconnect();
}

checkRoutingIssue().catch(console.error);
