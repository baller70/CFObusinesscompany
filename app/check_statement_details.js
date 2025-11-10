const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatementDetails() {
  try {
    const statement = await prisma.bankStatement.findFirst({
      where: { fileName: 'Jan 2024.pdf' },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } }
      }
    });

    if (!statement) {
      console.log('No statement found');
      return;
    }

    console.log('\n📄 Statement Details:\n');
    console.log('ID:', statement.id);
    console.log('File:', statement.fileName);
    console.log('User:', statement.user.email);
    console.log('Status:', statement.processingStatus);
    console.log('Stage:', statement.processingStage);
    console.log('Transactions:', statement.transactionCount);
    console.log('File Size:', statement.fileSize);
    console.log('Created:', statement.createdAt);
    console.log('\nError Log:');
    console.log(statement.errorLog || 'No errors');
    console.log('\nValidation Results:');
    console.log(statement.validationResults || 'No validation results');

    // Check actual transactions in database
    const transactions = await prisma.transaction.findMany({
      where: { bankStatementId: statement.id },
      select: { 
        id: true, 
        date: true, 
        description: true, 
        amount: true, 
        type: true 
      },
      take: 25
    });

    console.log(`\n✅ Actual Transactions in DB: ${transactions.length}`);
    if (transactions.length > 0) {
      console.log('\nFirst 10 transactions:');
      transactions.slice(0, 10).forEach((t, idx) => {
        console.log(`${idx + 1}. ${t.date} | ${t.description.substring(0, 40)} | $${t.amount} | ${t.type}`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkStatementDetails();
