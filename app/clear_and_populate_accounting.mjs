import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Global entry number counter
let globalEntryNumber = 1;

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // STEP 0: Clear existing accounting data
    console.log('🗑️  STEP 0: Clearing existing accounting data...\n');
    
    const deletedJournalLines = await prisma.journalEntryLine.deleteMany({
      where: { journalEntry: { userId: user.id } }
    });
    console.log(`  Deleted ${deletedJournalLines.count} journal entry lines`);
    
    const deletedJournalEntries = await prisma.journalEntry.deleteMany({
      where: { userId: user.id }
    });
    console.log(`  Deleted ${deletedJournalEntries.count} journal entries`);
    
    const deletedAccounts = await prisma.chartOfAccount.deleteMany({
      where: { userId: user.id }
    });
    console.log(`  Deleted ${deletedAccounts.count} chart of accounts`);
    
    const deletedReconciliations = await prisma.reconciliation.deleteMany({
      where: { userId: user.id }
    });
    console.log(`  Deleted ${deletedReconciliations.count} reconciliations\n`);

    console.log('👤 User:', user.email);
    console.log('📊 Processing', user.businessProfiles.length, 'business profiles\n');

    let totalAccounts = 0;
    let totalJournalEntries = 0;
    let totalReconciliations = 0;

    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 Profile: ${profile.name} (${profile.type})`);
      console.log('='.repeat(60));

      // Step 1: Create Chart of Accounts
      console.log('\n📖 STEP 1: Creating Chart of Accounts...');
      const accounts = await createChartOfAccounts(user.id, profile.id, profile.type);
      totalAccounts += accounts;
      console.log(`✅ Created ${accounts} accounts`);

      // Step 2: Create Journal Entries from Transactions
      console.log('\n📝 STEP 2: Creating Journal Entries...');
      const entries = await createJournalEntries(user.id, profile.id, profile.type);
      totalJournalEntries += entries;
      console.log(`✅ Created ${entries} journal entries`);

      // Step 3: Create Reconciliations
      console.log('\n🔄 STEP 3: Creating Reconciliations...');
      const reconciliations = await createReconciliations(user.id, profile.id, profile.type);
      totalReconciliations += reconciliations;
      console.log(`✅ Created ${reconciliations} reconciliations`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ ACCOUNTING FEATURES POPULATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`📖 Total Chart of Accounts: ${totalAccounts}`);
    console.log(`📝 Total Journal Entries: ${totalJournalEntries}`);
    console.log(`🔄 Total Reconciliations: ${totalReconciliations}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createChartOfAccounts(userId, businessProfileId, profileType) {
  const isPersonal = profileType === 'PERSONAL';
  
  // Standard Chart of Accounts with unique codes per profile
  const accounts = [
    // ASSETS
    { code: `1000-${businessProfileId.slice(-4)}`, name: 'Cash', type: 'ASSET', description: 'Cash on hand' },
    { code: `1010-${businessProfileId.slice(-4)}`, name: 'Checking Account', type: 'ASSET', description: 'Bank checking account' },
    { code: `1020-${businessProfileId.slice(-4)}`, name: 'Savings Account', type: 'ASSET', description: 'Bank savings account' },
    { code: `1100-${businessProfileId.slice(-4)}`, name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers' },
    
    // LIABILITIES
    { code: `2000-${businessProfileId.slice(-4)}`, name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to vendors' },
    { code: `2010-${businessProfileId.slice(-4)}`, name: 'Credit Cards', type: 'LIABILITY', description: 'Credit card balances' },
    { code: `2100-${businessProfileId.slice(-4)}`, name: 'Loans Payable', type: 'LIABILITY', description: 'Outstanding loans' },
    
    // EQUITY
    { code: `3000-${businessProfileId.slice(-4)}`, name: isPersonal ? 'Personal Equity' : "Owner's Equity", type: 'EQUITY', description: 'Owner equity' },
    { code: `3100-${businessProfileId.slice(-4)}`, name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated earnings' },
    
    // REVENUE
    { code: `4000-${businessProfileId.slice(-4)}`, name: 'Sales Revenue', type: 'REVENUE', description: 'Income from sales' },
    { code: `4010-${businessProfileId.slice(-4)}`, name: 'Service Revenue', type: 'REVENUE', description: 'Income from services' },
    { code: `4100-${businessProfileId.slice(-4)}`, name: 'Other Income', type: 'REVENUE', description: 'Miscellaneous income' },
  ];

  // Get all categories for this profile
  const categories = await prisma.category.findMany({
    where: {
      userId,
      businessProfileId
    }
  });

  // Add accounts for each category
  let codeCounter = 5000;
  for (const category of categories) {
    const accountType = category.type === 'INCOME' ? 'REVENUE' : 'EXPENSE';
    const codePrefix = category.type === 'INCOME' ? 4 : 5;
    
    accounts.push({
      code: `${codePrefix}${codeCounter}-${businessProfileId.slice(-4)}`,
      name: category.name,
      type: accountType,
      description: `${accountType.toLowerCase()} account for ${category.name}`
    });
    codeCounter += 10;
  }

  // Create all accounts
  let created = 0;
  for (const account of accounts) {
    await prisma.chartOfAccount.create({
      data: {
        userId,
        businessProfileId,
        ...account
      }
    });
    created++;
  }

  return created;
}

async function createJournalEntries(userId, businessProfileId, profileType) {
  // Get all transactions for this profile
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      businessProfileId
    },
    orderBy: {
      date: 'asc'
    }
  });

  console.log(`  Found ${transactions.length} transactions to process`);

  // Get checking account for this profile
  const cashAccount = await prisma.chartOfAccount.findFirst({
    where: { 
      userId, 
      businessProfileId,
      name: 'Checking Account'
    }
  });

  if (!cashAccount) {
    console.log('⚠️  No cash account found for this profile');
    return 0;
  }

  let created = 0;

  for (const transaction of transactions) {
    // Find account for this category
    let categoryAccount = await prisma.chartOfAccount.findFirst({
      where: {
        userId,
        businessProfileId,
        name: transaction.category
      }
    });

    if (!categoryAccount) {
      // Use other income/expense account
      const accountType = transaction.type === 'INCOME' ? 'Other Income' : 'Other Expense';
      categoryAccount = await prisma.chartOfAccount.findFirst({
        where: {
          userId,
          businessProfileId,
          type: transaction.type === 'INCOME' ? 'REVENUE' : 'EXPENSE'
        }
      }) || cashAccount;
    }

    // Create journal entry with global entry number
    const amount = Math.abs(transaction.amount);
    const isIncome = transaction.type === 'INCOME';

    await prisma.journalEntry.create({
      data: {
        userId,
        businessProfileId,
        entryNumber: `JE-${globalEntryNumber.toString().padStart(6, '0')}`,
        date: transaction.date,
        description: transaction.description || `${transaction.category}`,
        reference: transaction.id,
        totalDebit: amount,
        totalCredit: amount,
        lines: {
          create: isIncome ? [
            {
              accountId: cashAccount.id,
              description: 'Cash received',
              debitAmount: amount,
              creditAmount: 0
            },
            {
              accountId: categoryAccount.id,
              description: transaction.description || transaction.category,
              debitAmount: 0,
              creditAmount: amount
            }
          ] : [
            {
              accountId: categoryAccount.id,
              description: transaction.description || transaction.category,
              debitAmount: amount,
              creditAmount: 0
            },
            {
              accountId: cashAccount.id,
              description: 'Cash paid',
              debitAmount: 0,
              creditAmount: amount
            }
          ]
        }
      }
    });

    created++;
    globalEntryNumber++;

    if (created % 100 === 0) {
      console.log(`  Progress: ${created} journal entries created...`);
    }
  }

  return created;
}

async function createReconciliations(userId, businessProfileId, profileType) {
  // Get all transactions grouped by month
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      businessProfileId
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Group by month/year
  const monthlyData = {};
  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!monthlyData[key]) {
      monthlyData[key] = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        transactions: []
      };
    }
    monthlyData[key].transactions.push(t);
  });

  let created = 0;
  let runningBalance = 0;

  for (const [key, data] of Object.entries(monthlyData).sort()) {
    const openingBalance = runningBalance;
    
    // Calculate net change
    const netChange = data.transactions.reduce((sum, t) => sum + t.amount, 0);
    const closingBalance = openingBalance + netChange;
    runningBalance = closingBalance;

    // Check if already exists
    const existing = await prisma.reconciliation.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: data.month,
          year: data.year
        }
      }
    });

    if (!existing) {
      await prisma.reconciliation.create({
        data: {
          userId,
          businessProfileId,
          month: data.month,
          year: data.year,
          openingBalance,
          closingBalance,
          bankBalance: closingBalance,
          status: 'COMPLETED',
          difference: 0,
          notes: `Reconciled ${data.transactions.length} transactions for ${profileType}`,
          reconciledAt: new Date()
        }
      });
      created++;
    }
  }

  return created;
}

main();
