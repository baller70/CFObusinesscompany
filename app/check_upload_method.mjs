import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUpload() {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: { 
        userId: (await prisma.user.findUnique({
          where: { email: 'khouston@thebasketballfactorynj.com' }
        })).id
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fileName: true,
        status: true,
        processingStage: true,
        transactionCount: true,
        createdAt: true
      }
    });

    console.log('\n=== RECENT UPLOADS ===\n');
    statements.forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.fileName}`);
      console.log(`   Status: ${s.status} | Stage: ${s.processingStage}`);
      console.log(`   Transactions: ${s.transactionCount}`);
      console.log(`   Uploaded: ${s.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUpload();
