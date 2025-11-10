require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDetails() {
  try {
    const statements = await prisma.bankStatement.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        transactions: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });
    
    for (const stmt of statements) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 Statement ID: ${stmt.id}`);
      console.log(`   File: ${stmt.fileName}`);
      console.log(`   Original: ${stmt.originalName}`);
      console.log(`   Status: ${stmt.status}`);
      console.log(`   Bank: ${stmt.bankName || 'N/A'}`);
      console.log(`   Account: ${stmt.accountNumber || 'N/A'}`);
      console.log(`   Period: ${stmt.periodStart || 'N/A'} to ${stmt.periodEnd || 'N/A'}`);
      console.log(`   Beginning Balance: $${stmt.beginningBalance || 'N/A'}`);
      console.log(`   Ending Balance: $${stmt.endingBalance || 'N/A'}`);
      console.log(`   Transactions in DB: ${stmt.transactions.length} (showing first 5)`);
      
      if (stmt.processingError) {
        console.log(`\n   ❌ Processing Error:`);
        console.log(`   ${stmt.processingError}`);
      }
      
      if (stmt.errorLog) {
        console.log(`\n   📋 Error Log:`);
        console.log(`   ${stmt.errorLog.substring(0, 500)}`);
      }
      
      if (stmt.validationResult) {
        try {
          const validation = JSON.parse(stmt.validationResult);
          console.log(`\n   ✅ Validation Results:`);
          console.log(`   ${JSON.stringify(validation, null, 2).substring(0, 500)}`);
        } catch(e) {}
      }
      
      if (stmt.flaggedIssues) {
        try {
          const issues = JSON.parse(stmt.flaggedIssues);
          console.log(`\n   ⚠️  Flagged Issues:`);
          console.log(`   ${JSON.stringify(issues, null, 2).substring(0, 500)}`);
        } catch(e) {}
      }
      
      console.log(`\n   Sample Transactions (first 5):`);
      for (const tx of stmt.transactions) {
        console.log(`   - ${tx.date.toISOString().split('T')[0]}: ${tx.description} - $${tx.amount} (${tx.type})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetails();
