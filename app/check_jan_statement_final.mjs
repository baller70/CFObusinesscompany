import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config();

const prisma = new PrismaClient();

async function checkStatement() {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: {
        OR: [
          { fileName: { contains: 'Jan 2024' } },
          { originalName: { contains: 'Jan 2024' } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true }
        },
        transactions: {
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            type: true,
            source: true
          },
          take: 10
        }
      }
    });
    
    console.log(`\nFound ${statements.length} statements with "Jan 2024" in name\n`);
    
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
      console.log(`Business Profile ID: ${stmt.businessProfileId || 'null'}`);
      
      if (stmt.errorLog) {
        console.log(`\nError Log:`);
        console.log(stmt.errorLog.substring(0, 1000));
      }
      
      console.log(`\nFirst 10 transactions:`);
      stmt.transactions.forEach((t, i) => {
        console.log(`${i+1}. ${t.date.toISOString().split('T')[0]} | ${t.description.substring(0, 30).padEnd(30)} | $${t.amount.toFixed(2).padStart(10)} | ${t.type} | ${t.source || 'N/A'}`);
      });
      console.log('='.repeat(80));
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatement();
