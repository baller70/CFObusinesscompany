require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    const statements = await prisma.bankStatement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: {
        transactions: {
          take: 15,
          orderBy: { date: 'desc' }
        }
      }
    });
    
    console.log('Recent Bank Statements and Their Transactions:');
    console.log('='.repeat(80));
    
    for (const stmt of statements) {
      console.log(`\nStatement: ${stmt.fileName}`);
      console.log(`Status: ${stmt.status}`);
      
      console.log(`\nExtracted Data Sample:`);
      if (stmt.extractedData && stmt.extractedData.transactions) {
        console.log(`Total extracted: ${stmt.extractedData.transactions.length} transactions`);
        console.log(`\nFirst 5 raw transactions from AI:`);
        stmt.extractedData.transactions.slice(0, 5).forEach((t, i) => {
          console.log(`  [${i+1}] type="${t.type}", amount=${t.amount}, desc="${t.description?.substring(0, 50)}"`);
        });
      }
      
      console.log(`\nStored Transactions in DB:`);
      const incomeCount = stmt.transactions.filter(t => t.type === 'INCOME').length;
      const expenseCount = stmt.transactions.filter(t => t.type === 'EXPENSE').length;
      const transferCount = stmt.transactions.filter(t => t.type === 'TRANSFER').length;
      
      console.log(`  INCOME: ${incomeCount}, EXPENSE: ${expenseCount}, TRANSFER: ${transferCount}`);
      console.log(`\nFirst 10 transactions:`);
      
      for (const txn of stmt.transactions.slice(0, 10)) {
        console.log(`  - ${txn.date.toISOString().split('T')[0]} | TYPE=${txn.type} | AMOUNT=$${txn.amount} | ${txn.description?.substring(0, 50)}`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTransactions();
