require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestStatement() {
  try {
    const statement = await prisma.bankStatement.findFirst({
      where: {
        fileName: {
          contains: 'Business Statement_Jan_8_2024'
        }
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    if (statement) {
      console.log('\n=== Latest PNC Statement ===');
      console.log('File:', statement.fileName);
      console.log('Status:', statement.status);
      console.log('Transactions extracted:', statement._count.transactions);
      console.log('\nProcessing Error:', statement.processingError || 'None');
      console.log('\nValidation Results:', statement.validationResults);
      
      // Get actual transactions to see what's been extracted
      const transactions = await prisma.transaction.findMany({
        where: { bankStatementId: statement.id },
        select: {
          date: true,
          amount: true,
          description: true,
          type: true
        },
        orderBy: { date: 'asc' },
        take: 5
      });
      
      console.log('\nFirst 5 transactions:');
      transactions.forEach((t, i) => {
        console.log(`${i+1}. ${t.date.toISOString().split('T')[0]} - ${t.description} - $${t.amount} (${t.type})`);
      });
      
    } else {
      console.log('No statement found with that filename');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestStatement();
