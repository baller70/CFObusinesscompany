import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function checkAccounting() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n=== USER INFO ===');
    console.log(`User: ${user.email}`);
    console.log(`Business Profiles: ${user.businessProfiles.map(p => p.name).join(', ')}`);

    // Check Chart of Accounts
    const chartOfAccounts = await prisma.chartOfAccount.findMany({
      where: { userId: user.id }
    });
    console.log('\n=== CHART OF ACCOUNTS ===');
    console.log(`Total Accounts: ${chartOfAccounts.length}`);
    if (chartOfAccounts.length > 0) {
      const grouped = chartOfAccounts.reduce((acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + 1;
        return acc;
      }, {});
      console.log('By Type:', JSON.stringify(grouped, null, 2));
    }

    // Check Journal Entries
    const journalEntries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      include: { lines: true }
    });
    console.log('\n=== JOURNAL ENTRIES ===');
    console.log(`Total Journal Entries: ${journalEntries.length}`);
    if (journalEntries.length > 0) {
      console.log('Sample:', journalEntries.slice(0, 3).map(j => ({
        entryNumber: j.entryNumber,
        date: j.date,
        description: j.description,
        totalDebit: j.totalDebit,
        totalCredit: j.totalCredit,
        linesCount: j.lines.length
      })));
    }

    // Check Reconciliations
    const reconciliations = await prisma.reconciliation.findMany({
      where: { userId: user.id }
    });
    console.log('\n=== RECONCILIATIONS ===');
    console.log(`Total Reconciliations: ${reconciliations.length}`);
    if (reconciliations.length > 0) {
      console.log('Sample:', reconciliations.slice(0, 3).map(r => ({
        month: r.month,
        year: r.year,
        status: r.status,
        openingBalance: r.openingBalance,
        closingBalance: r.closingBalance,
        difference: r.difference
      })));
    }

    // Check Transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' }
    });
    console.log('\n=== TRANSACTIONS ===');
    console.log(`Total Transactions: ${transactions.length}`);
    if (transactions.length > 0) {
      console.log(`Date Range: ${transactions[0].date} to ${transactions[transactions.length - 1].date}`);
      const byYear = transactions.reduce((acc, t) => {
        const year = new Date(t.date).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});
      console.log('By Year:', byYear);
      
      const byType = transactions.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {});
      console.log('By Type:', byType);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccounting();
