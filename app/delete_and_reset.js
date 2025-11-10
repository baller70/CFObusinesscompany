const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAndReset() {
  try {
    const statement = await prisma.bankStatement.findFirst({
      where: { fileName: 'Jan 2024.pdf' },
      orderBy: { createdAt: 'desc' }
    });

    if (statement) {
      console.log(`Deleting statement: ${statement.id}`);
      
      // Delete associated transactions
      await prisma.transaction.deleteMany({
        where: { bankStatementId: statement.id }
      });
      console.log('Deleted associated transactions');
      
      // Delete the statement
      await prisma.bankStatement.delete({
        where: { id: statement.id }
      });
      console.log('✅ Statement deleted successfully');
    } else {
      console.log('No statement found to delete');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

deleteAndReset();
