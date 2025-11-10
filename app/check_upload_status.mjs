import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function checkUploadStatus() {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: {
        fileName: {
          contains: 'JAN 2024',
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log(`Found ${statements.length} statements for Jan 2024:`);
    statements.forEach((stmt, idx) => {
      console.log(`\n=== Statement #${idx + 1} ===`);
      console.log(`ID: ${stmt.id}`);
      console.log(`File: ${stmt.fileName}`);
      console.log(`User: ${stmt.user.email}`);
      console.log(`Status: ${stmt.status}`);
      console.log(`Uploaded: ${stmt.createdAt}`);
      console.log(`Processed: ${stmt.processedAt || 'Not processed'}`);
      console.log(`Error: ${stmt.errorLog || 'None'}`);
      console.log(`Transaction Count: ${stmt.transactionCount || 0}`);
      console.log(`Bank: ${stmt.bankName || 'Unknown'}`);
    });

  } catch (error) {
    console.error('Error checking upload status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUploadStatus();
