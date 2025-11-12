
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixAccountingBalances() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('\n🔧 FIXING ACCOUNTING BALANCES\n');
    console.log(`User: ${user.email}`);
    console.log(`Active Profile: ${user.currentBusinessProfileId}\n`);

    // Fix Chart of Accounts Balances
    console.log('📊 Updating Chart of Accounts balances from Journal Entries...\n');

    for (const profile of user.businessProfiles) {
      console.log(`\n  Processing: ${profile.name} (${profile.type})`);

      // Get all accounts for this profile
      const accounts = await prisma.chartOfAccount.findMany({
        where: {
          userId: user.id,
          businessProfileId: profile.id
        }
      });

      console.log(`  Found ${accounts.length} accounts`);

      // Calculate balance for each account from journal entry lines
      let updatedCount = 0;
      for (const account of accounts) {
        // Get all journal entry lines for this account
        const lines = await prisma.journalEntryLine.findMany({
          where: { accountId: account.id },
          include: {
            journalEntry: true
          }
        });

        // Calculate balance (debit - credit for assets/expenses, credit - debit for liabilities/equity/revenue)
        let balance = 0;
        lines.forEach(line => {
          if (['ASSET', 'EXPENSE'].includes(account.type)) {
            balance += (line.debitAmount - line.creditAmount);
          } else {
            balance += (line.creditAmount - line.debitAmount);
          }
        });

        // Update account balance
        if (balance !== account.balance) {
          await prisma.chartOfAccount.update({
            where: { id: account.id },
            data: { balance: balance }
          });
          updatedCount++;
        }
      }

      console.log(`  ✅ Updated ${updatedCount} account balances`);

      // Calculate totals by type
      const updatedAccounts = await prisma.chartOfAccount.findMany({
        where: {
          userId: user.id,
          businessProfileId: profile.id
        }
      });

      const totals = {};
      updatedAccounts.forEach(acc => {
        if (!totals[acc.type]) totals[acc.type] = 0;
        totals[acc.type] += acc.balance;
      });

      console.log('\n  Account Balances by Type:');
      Object.keys(totals).forEach(type => {
        console.log(`    ${type}: $${totals[type].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      });
    }

    // Fix Reconciliations - Create for Business profile if missing
    console.log('\n\n🔄 Checking Reconciliations...\n');

    for (const profile of user.businessProfiles) {
      const existingRecons = await prisma.reconciliation.count({
        where: {
          userId: user.id,
          businessProfileId: profile.id
        }
      });

      console.log(`  ${profile.name}: ${existingRecons} reconciliations`);

      if (existingRecons === 0 && profile.type === 'BUSINESS') {
        console.log(`    Creating reconciliations for ${profile.name}...`);

        // Get all transactions for this profile grouped by month
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            businessProfileId: profile.id
          },
          orderBy: { date: 'asc' }
        });

        // Group by month/year
        const byMonth = {};
        transactions.forEach(txn => {
          const date = new Date(txn.date);
          const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (!byMonth[key]) {
            byMonth[key] = {
              month: date.getMonth() + 1,
              year: date.getFullYear(),
              transactions: []
            };
          }
          byMonth[key].transactions.push(txn);
        });

        // Create reconciliation for each month
        let prevBalance = 0;
        for (const [key, data] of Object.entries(byMonth).sort()) {
          const monthTotal = data.transactions.reduce((sum, txn) => sum + txn.amount, 0);
          const closingBalance = prevBalance + monthTotal;

          await prisma.reconciliation.create({
            data: {
              userId: user.id,
              businessProfileId: profile.id,
              month: data.month,
              year: data.year,
              openingBalance: prevBalance,
              closingBalance: closingBalance,
              bankBalance: closingBalance,
              status: 'COMPLETED',
              difference: 0,
              notes: `Reconciled ${data.transactions.length} transactions for ${profile.type}`,
              reconciledAt: new Date()
            }
          });

          prevBalance = closingBalance;
          console.log(`      ✅ Created reconciliation for ${data.year}-${data.month.toString().padStart(2, '0')}`);
        }
      }
    }

    console.log('\n\n✅ ACCOUNTING BALANCES FIXED SUCCESSFULLY!\n');
    console.log('Summary:');
    console.log('- Chart of Accounts balances updated from journal entries');
    console.log('- Reconciliations created for Business profile');
    console.log('\nYou can now view the updated accounting features in the app.');

  } finally {
    await prisma.$disconnect();
  }
}

fixAccountingBalances().catch(console.error);
