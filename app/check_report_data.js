const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReportData() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' },
      include: {
        businessProfiles: true
      }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('=== USER INFO ===');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Current Business Profile ID: ${user.currentBusinessProfileId}`);
    console.log('\n=== BUSINESS PROFILES ===');
    
    for (const profile of user.businessProfiles) {
      console.log(`\nProfile ID: ${profile.id}`);
      console.log(`Name: ${profile.name}`);
      console.log(`Type: ${profile.type}`);
      console.log(`Is Active: ${profile.isActive}`);
      console.log(`Is Current: ${profile.id === user.currentBusinessProfileId}`);
    }

    // Get the current profile or first active profile
    const currentProfileId = user.currentBusinessProfileId || user.businessProfiles.filter(p => p.isActive)[0]?.id;
    
    if (!currentProfileId) {
      console.log('\nNo active business profile found!');
      return;
    }

    const currentProfile = user.businessProfiles.find(p => p.id === currentProfileId);
    console.log(`\n=== USING PROFILE: ${currentProfile?.name} (${currentProfile?.type}) ===`);
    console.log(`Profile ID: ${currentProfileId}`);

    // Check if this is the personal profile
    if (currentProfile?.type !== 'PERSONAL') {
      console.log('\n⚠️  WARNING: Current profile is NOT Personal/Household!');
      console.log('Reports will show business data, not personal data!');
    } else {
      console.log('\n✓ Current profile is Personal/Household - correct for personal reports');
    }

    // Get transactions for this profile
    const totalTransactions = await prisma.transaction.count({
      where: { businessProfileId: currentProfileId }
    });
    console.log(`\nTotal transaction count for this profile: ${totalTransactions}`);

    // Calculate income and expenses for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthTransactions = await prisma.transaction.findMany({
      where: { 
        businessProfileId: currentProfileId,
        date: { gte: startOfMonth, lte: now }
      }
    });

    const monthIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpenses = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    console.log('\n=== CURRENT MONTH FINANCIAL SUMMARY ===');
    console.log(`Period: ${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}`);
    console.log(`Transaction count: ${monthTransactions.length}`);
    console.log(`Total Income: $${monthIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${monthExpenses.toFixed(2)}`);
    console.log(`Net Income: $${(monthIncome - monthExpenses).toFixed(2)}`);

    // Calculate all-time totals
    const allTransactions = await prisma.transaction.findMany({
      where: { businessProfileId: currentProfileId }
    });

    const allIncome = allTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const allExpenses = allTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    console.log('\n=== ALL-TIME FINANCIAL SUMMARY ===');
    console.log(`Total Income: $${allIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${allExpenses.toFixed(2)}`);
    console.log(`Net Income: $${(allIncome - allExpenses).toFixed(2)}`);

    // Sample transactions
    const sampleTransactions = await prisma.transaction.findMany({
      where: { businessProfileId: currentProfileId },
      orderBy: { date: 'desc' },
      take: 5
    });

    console.log('\n=== SAMPLE RECENT TRANSACTIONS ===');
    sampleTransactions.forEach(t => {
      console.log(`${t.date.toLocaleDateString()} | ${t.type.padEnd(8)} | $${t.amount.toFixed(2).padStart(10)} | ${t.description}`);
    });

    // Check budgets
    const budgets = await prisma.budget.findMany({
      where: { businessProfileId: currentProfileId }
    });

    console.log(`\n=== BUDGETS ===`);
    console.log(`Total budgets: ${budgets.length}`);
    
    if (budgets.length > 0) {
      console.log('Sample budgets:');
      budgets.slice(0, 5).forEach(b => {
        console.log(`  ${b.category}: $${b.amount.toFixed(2)} (${b.month}/${b.year})`);
      });
    }

    // Check data distribution across all profiles
    console.log('\n=== DATA DISTRIBUTION ACROSS ALL PROFILES ===');
    for (const profile of user.businessProfiles) {
      const count = await prisma.transaction.count({
        where: { businessProfileId: profile.id }
      });
      console.log(`${profile.name} (${profile.type}): ${count} transactions`);
    }

    // Find Personal/Household profile
    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    if (personalProfile && personalProfile.id !== currentProfileId) {
      console.log('\n⚠️  IMPORTANT FINDING:');
      console.log(`Personal/Household profile ID: ${personalProfile.id}`);
      console.log(`Current profile ID: ${currentProfileId}`);
      console.log('User needs to switch to Personal/Household profile for personal reports!');
      
      const personalTransactionCount = await prisma.transaction.count({
        where: { businessProfileId: personalProfile.id }
      });
      console.log(`\nPersonal/Household has ${personalTransactionCount} transactions`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReportData();
