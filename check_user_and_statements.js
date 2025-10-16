const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserAndStatements() {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'khouston721@gmail.com' }
    });
    
    console.log('\n=== USER INFO ===');
    if (user) {
      console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name
      });
    } else {
      console.log('User NOT found with email: khouston721@gmail.com');
    }

    // Check statements for this user
    if (user) {
      const statements = await prisma.bankStatement.findMany({
        where: { userId: user.id },
        orderBy: { uploadedAt: 'desc' }
      });
      
      console.log('\n=== BANK STATEMENTS ===');
      console.log(`Found ${statements.length} statements:`);
      statements.forEach((stmt, idx) => {
        console.log(`\n${idx + 1}. ${stmt.fileName}`);
        console.log(`   Status: ${stmt.processingStatus}`);
        console.log(`   Account: ${stmt.accountNumber || 'N/A'}`);
        console.log(`   Uploaded: ${stmt.uploadedAt}`);
        console.log(`   Error: ${stmt.errorMessage || 'None'}`);
      });

      // Check transactions for each statement
      for (const stmt of statements) {
        const txCount = await prisma.transaction.count({
          where: { bankStatementId: stmt.id }
        });
        console.log(`\nTransactions for ${stmt.fileName}: ${txCount}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndStatements();
