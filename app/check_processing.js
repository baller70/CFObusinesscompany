require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProcessing() {
  try {
    console.log('=== Checking Bank Statement Processing ===\n');
    
    const statements = await prisma.bankStatement.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        transactions: true
      }
    });
    
    console.log(`Total statements: ${statements.length}\n`);
    
    for (const stmt of statements) {
      console.log(`\n📄 Statement: ${stmt.fileName}`);
      console.log(`   Status: ${stmt.status}`);
      console.log(`   Updated: ${stmt.updatedAt}`);
      console.log(`   Transactions in DB: ${stmt.transactions.length}`);
      
      if (stmt.processingError) {
        console.log(`   ❌ Error: ${stmt.processingError}`);
      }
      
      if (stmt.extractedData) {
        try {
          const data = JSON.parse(stmt.extractedData);
          console.log(`   Extracted by AI: ${data.transactions?.length || 0} transactions`);
          console.log(`   Account holder: ${data.accountHolder || 'N/A'}`);
          console.log(`   Bank name: ${data.bankName || 'N/A'}`);
        } catch (e) {
          console.log('   Could not parse extracted data');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProcessing();
