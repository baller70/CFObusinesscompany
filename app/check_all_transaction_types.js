require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTransactions() {
  try {
    const statements = await prisma.bankStatement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: {
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    });
    
    console.log('ALL Transactions - Type Analysis:');
    console.log('='.repeat(80));
    
    for (const stmt of statements) {
      console.log(`\nStatement: ${stmt.fileName} (${stmt.transactions.length} transactions)`);
      
      const incomeCount = stmt.transactions.filter(t => t.type === 'INCOME').length;
      const expenseCount = stmt.transactions.filter(t => t.type === 'EXPENSE').length;
      const transferCount = stmt.transactions.filter(t => t.type === 'TRANSFER').length;
      
      console.log(`  INCOME: ${incomeCount} | EXPENSE: ${expenseCount} | TRANSFER: ${transferCount}`);
      
      console.log(`\nAI Extraction vs DB Storage:`);
      if (stmt.extractedData && stmt.extractedData.transactions) {
        const aiCredits = stmt.extractedData.transactions.filter(t => t.type === 'credit').length;
        const aiDebits = stmt.extractedData.transactions.filter(t => t.type === 'debit').length;
        console.log(`  AI extracted: ${aiCredits} credits, ${aiDebits} debits`);
      }
      
      console.log(`\n  Sample INCOME transactions (should be positive, green):`);
      stmt.transactions.filter(t => t.type === 'INCOME').slice(0, 5).forEach(t => {
        console.log(`    $${t.amount} | ${t.description?.substring(0, 50)}`);
      });
      
      console.log(`\n  Sample EXPENSE transactions (should be negative, red):`);
      stmt.transactions.filter(t => t.type === 'EXPENSE').slice(0, 5).forEach(t => {
        console.log(`    $${t.amount} | ${t.description?.substring(0, 50)}`);
      });
      
      console.log(`\n  First 10 transactions in order:`);
      stmt.transactions.slice(0, 10).forEach(t => {
        const sign = t.type === 'INCOME' ? '+' : '-';
        console.log(`    ${sign}$${t.amount} [${t.type}] | ${t.description?.substring(0, 40)}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAllTransactions();
