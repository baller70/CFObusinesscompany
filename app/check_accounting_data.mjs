import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function checkAccountingData() {
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
    console.log('📊 Business Profiles:', user.businessProfiles.map(p => `${p.name} (${p.type})`).join(', '));
    console.log('');

    // Check Chart of Accounts
    const chartOfAccounts = await prisma.chartOfAccount.count({
      where: { userId: user.id }
    });
    console.log('📖 Chart of Accounts:', chartOfAccounts);

    // Check Journal Entries
    const journalEntries = await prisma.journalEntry.count({
      where: { userId: user.id }
    });
    console.log('📝 Journal Entries:', journalEntries);

    // Check Reconciliations
    const reconciliations = await prisma.reconciliation.count({
      where: { userId: user.id }
    });
    console.log('🔄 Reconciliations:', reconciliations);

    // Check transactions
    const transactions = await prisma.transaction.count({
      where: { userId: user.id }
    });
    console.log('💰 Transactions:', transactions);

    console.log('');
    console.log('✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccountingData();
