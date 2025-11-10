const { PrismaClient } = require('@prisma/client');

async function checkTransactionProcessing() {
  const prisma = new PrismaClient();
  
  try {
    // Get the user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    // Get recent bank statement uploads
    const uploads = await prisma.bankStatementUpload.findMany({
      where: { userId: user.id },
      orderBy: { uploadedAt: 'desc' },
      take: 5
    });

    console.log('\n=== BANK STATEMENT UPLOADS ===\n');
    for (const upload of uploads) {
      console.log(`File: ${upload.fileName}`);
      console.log(`Status: ${upload.status}`);
      console.log(`Processing Stage: ${upload.processingStage || 'N/A'}`);
      console.log(`Uploaded: ${upload.uploadedAt}`);
      console.log(`Processed: ${upload.processedAt || 'Not yet'}`);
      
      if (upload.errorLog) {
        console.log(`❌ ERROR: ${upload.errorLog}`);
      }
      
      // Count transactions for this statement
      const transactionCount = await prisma.transaction.count({
        where: { 
          userId: user.id,
          // Try to find transactions around the statement date
        }
      });
      
      console.log(`Total transactions in DB: ${transactionCount}`);
      console.log('---\n');
    }

    // Get all transactions for the user
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      include: {
        category: true
      }
    });

    console.log(`\n=== TOTAL TRANSACTIONS: ${allTransactions.length} ===\n`);
    
    // Group by month
    const byMonth = {};
    allTransactions.forEach(t => {
      const month = t.date.toISOString().substring(0, 7);
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(t);
    });

    console.log('Transactions by month:');
    Object.keys(byMonth).sort().reverse().forEach(month => {
      console.log(`${month}: ${byMonth[month].length} transactions`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionProcessing();
