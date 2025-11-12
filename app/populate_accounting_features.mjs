import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function populateAccountingFeatures() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

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
  
  // Standard Chart of Accounts
  const accounts = [
    // ASSETS
    { code: '1000', name: 'Cash', type: 'ASSET', description: 'Cash on hand' },
    { code: '1010', name: 'Checking Account', type: 'ASSET', description: 'Bank checking account' },
    { code: '1020', name: 'Savings Account', type: 'ASSET', description: 'Bank savings account' },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers' },
    
    // LIABILITIES
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to vendors' },
    { code: '2010', name: 'Credit Cards', type: 'LIABILITY', description: 'Credit card balances' },
    { code: '2100', name: 'Loans Payable', type: 'LIABILITY', description: 'Outstanding loans' },
    
    // EQUITY
    { code: '3000', name: isPersonal ? 'Personal Equity' : "Owner's Equity", type: 'EQUITY', description: 'Owner equity' },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated earnings' },
    
    // REVENUE
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE', description: 'Income from sales' },
    { code: '4010', name: 'Service Revenue', type: 'REVENUE', description: 'Income from services' },
    { code: '4100', name: 'Other Income', type: 'REVENUE', description: 'Miscellaneous income' },
  ];

  // Get all expense categories from transactions for this profile
  const categories = await prisma.category.findMany({
    where: {
      userId,
      businessProfileId,
      type: 'EXPENSE'
    }
  });

  // Add expense accounts for each category
  let expenseCode = 5000;
  for (const category of categories) {
    accounts.push({
      code: expenseCode.toString(),
      name: category.name,
      type: 'EXPENSE',
      description: `Expense account for ${category.name}`
    });
    expenseCode += 10;
  }

  // Create all accounts
  let created = 0;
  for (const account of accounts) {
    try {
      await prisma.chartOfAccount.upsert({
        where: {
          userId_code: {
            userId,
            code: account.code
          }
        },
        create: {
          userId,
          businessProfileId,
          ...account
        },
        update: {
          businessProfileId,
          ...account
        }
      });
      created++;
    } catch (error) {
      console.log(`⚠️  Skipped ${account.name}: ${error.message}`);
    }
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

  // Get relevant accounts
  const cashAccount = await prisma.chartOfAccount.findFirst({
    where: { userId, code: '1010' }
  });

  if (!cashAccount) {
    console.log('⚠️  No cash account found');
    return 0;
  }

  let created = 0;
  let entryNumber = 1;

  for (const transaction of transactions) {
    try {
      // Find or create expense/revenue account for this category
      let categoryAccount = await prisma.chartOfAccount.findFirst({
        where: {
          userId,
          businessProfileId,
          name: transaction.category
        }
      });

      if (!categoryAccount) {
        // Create a generic account if category doesn't exist
        const accountType = transaction.type === 'INCOME' ? 'REVENUE' : 'EXPENSE';
        const codePrefix = transaction.type === 'INCOME' ? 4 : 5;
        const code = `${codePrefix}${Math.floor(Math.random() * 1000)}`;
        
        categoryAccount = await prisma.chartOfAccount.create({
          data: {
            userId,
            businessProfileId,
            code,
            name: transaction.category,
            type: accountType,
            description: `Auto-created from transactions`
          }
        });
      }

      // Create journal entry
      const amount = Math.abs(transaction.amount);
      const isIncome = transaction.type === 'INCOME';

      const journalEntry = await prisma.journalEntry.create({
        data: {
          userId,
          businessProfileId,
          entryNumber: `JE-${entryNumber.toString().padStart(6, '0')}`,
          date: transaction.date,
          description: transaction.description || `Transaction: ${transaction.category}`,
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
      entryNumber++;

      if (created % 100 === 0) {
        console.log(`  Progress: ${created} journal entries created...`);
      }
    } catch (error) {
      console.log(`⚠️  Skipped transaction ${transaction.id}: ${error.message}`);
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
    try {
      const openingBalance = runningBalance;
      
      // Calculate net change
      const netChange = data.transactions.reduce((sum, t) => {
        return sum + t.amount;
      }, 0);

      const closingBalance = openingBalance + netChange;
      runningBalance = closingBalance;

      await prisma.reconciliation.upsert({
        where: {
          userId_month_year: {
            userId,
            month: data.month,
            year: data.year
          }
        },
        create: {
          userId,
          businessProfileId,
          month: data.month,
          year: data.year,
          openingBalance,
          closingBalance,
          bankBalance: closingBalance,
          status: 'COMPLETED',
          difference: 0,
          notes: `Reconciled ${data.transactions.length} transactions`,
          reconciledAt: new Date()
        },
        update: {
          businessProfileId,
          openingBalance,
          closingBalance,
          bankBalance: closingBalance,
          status: 'COMPLETED',
          difference: 0,
          notes: `Reconciled ${data.transactions.length} transactions`,
          reconciledAt: new Date()
        }
      });

      created++;
    } catch (error) {
      console.log(`⚠️  Skipped reconciliation for ${data.year}-${data.month}: ${error.message}`);
    }
  }

  return created;
}

populateAccountingFeatures();
