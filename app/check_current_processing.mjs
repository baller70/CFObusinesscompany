import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config();

const prisma = new PrismaClient();

async function checkProcessing() {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'PROCESSING' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log(`\nFound ${statements.length} statements in PENDING or PROCESSING state\n`);
    
    for (const stmt of statements) {
      console.log('='.repeat(80));
      console.log(`Statement ID: ${stmt.id}`);
      console.log(`File Name: ${stmt.fileName}`);
      console.log(`Original Name: ${stmt.originalName}`);
      console.log(`Status: ${stmt.status}`);
      console.log(`Processing Stage: ${stmt.processingStage}`);
      console.log(`Record Count: ${stmt.recordCount}`);
      console.log(`Processed Count: ${stmt.processedCount}`);
      console.log(`Transaction Count in DB: ${stmt._count.transactions}`);
      console.log(`Created At: ${stmt.createdAt}`);
      console.log(`User ID: ${stmt.userId}`);
      console.log('='.repeat(80));
      console.log('');
    }
    
    // Also show all recent statements
    const recentStatements = await prisma.bankStatement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    console.log('\n\nMost recent 5 statements:');
    console.log('='.repeat(80));
    for (const stmt of recentStatements) {
      console.log(`${stmt.fileName} | Status: ${stmt.status} | Stage: ${stmt.processingStage} | Transactions: ${stmt._count.transactions} | Created: ${stmt.createdAt}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProcessing();
