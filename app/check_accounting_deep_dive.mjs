
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
      console.log('User not found');
      return;
    }
    
    console.log('\n=== USER INFO ===');
    console.log('Current Business Profile ID:', user.currentBusinessProfileId);
    console.log('\nBusiness Profiles:');
    user.businessProfiles.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}, Type: ${p.type})`);
    });
    
    // Check Chart of Accounts
    console.log('\n=== CHART OF ACCOUNTS ===');
    const accounts = await prisma.chartOfAccount.findMany({
      where: { userId: user.id }
    });
    console.log(`Total accounts: ${accounts.length}`);
    
    // Group by businessProfileId
    const byProfile = {};
    accounts.forEach(acc => {
      const key = acc.businessProfileId || 'null';
      if (!byProfile[key]) byProfile[key] = [];
      byProfile[key].push(acc);
    });
    
    Object.keys(byProfile).forEach(profileId => {
      const profileAccounts = byProfile[profileId];
      console.log(`\nProfile ${profileId}: ${profileAccounts.length} accounts`);
      
      // Show sample accounts with balances
      profileAccounts.slice(0, 5).forEach(acc => {
        console.log(`  - ${acc.name}: Balance = $${acc.balance}, Type = ${acc.type}`);
      });
      
      // Calculate totals by type
      const totals = {};
      profileAccounts.forEach(acc => {
        if (!totals[acc.type]) totals[acc.type] = 0;
        totals[acc.type] += parseFloat(acc.balance);
      });
      console.log('\n  Totals by type:');
      Object.keys(totals).forEach(type => {
        console.log(`    ${type}: $${totals[type].toFixed(2)}`);
      });
    });
    
    // Check Journal Entries
    console.log('\n=== JOURNAL ENTRIES ===');
    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      include: { lines: true }
    });
    console.log(`Total entries: ${entries.length}`);
    
    const entriesByProfile = {};
    entries.forEach(entry => {
      const key = entry.businessProfileId || 'null';
      if (!entriesByProfile[key]) entriesByProfile[key] = [];
      entriesByProfile[key].push(entry);
    });
    
    Object.keys(entriesByProfile).forEach(profileId => {
      const profileEntries = entriesByProfile[profileId];
      console.log(`\nProfile ${profileId}: ${profileEntries.length} entries`);
      
      // Calculate total debits and credits
      let totalDebits = 0;
      let totalCredits = 0;
      profileEntries.forEach(entry => {
        entry.lines.forEach(line => {
          totalDebits += parseFloat(line.debit);
          totalCredits += parseFloat(line.credit);
        });
      });
      console.log(`  Total Debits: $${totalDebits.toFixed(2)}`);
      console.log(`  Total Credits: $${totalCredits.toFixed(2)}`);
    });
    
    // Check Reconciliations
    console.log('\n=== RECONCILIATIONS ===');
    const reconciliations = await prisma.reconciliation.findMany({
      where: { userId: user.id }
    });
    console.log(`Total reconciliations: ${reconciliations.length}`);
    
    const reconByProfile = {};
    reconciliations.forEach(recon => {
      const key = recon.businessProfileId || 'null';
      if (!reconByProfile[key]) reconByProfile[key] = [];
      reconByProfile[key].push(recon);
    });
    
    Object.keys(reconByProfile).forEach(profileId => {
      const profileRecons = reconByProfile[profileId];
      console.log(`\nProfile ${profileId}: ${profileRecons.length} reconciliations`);
      profileRecons.forEach(recon => {
        console.log(`  - ${recon.accountName}: ${recon.status}, Period: ${recon.period}`);
      });
    });
    
  } finally {
    await prisma.$disconnect();
  }
}

checkAccountingData().catch(console.error);
