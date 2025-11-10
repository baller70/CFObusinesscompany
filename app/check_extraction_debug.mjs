import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkExtractedData() {
  try {
    const statement = await prisma.bankStatement.findFirst({
      where: {
        fileName: 'Jan 2024.pdf'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!statement) {
      console.log('No statement found');
      return;
    }
    
    console.log('\n=== STATEMENT INFO ===');
    console.log(`ID: ${statement.id}`);
    console.log(`File: ${statement.fileName}`);
    console.log(`Status: ${statement.status}`);
    console.log(`Stage: ${statement.processingStage}`);
    console.log(`Record Count: ${statement.recordCount}`);
    console.log(`File Size: ${statement.fileSize} bytes`);
    
    if (statement.extractedData) {
      const extracted = statement.extractedData;
      console.log('\n=== EXTRACTED DATA ===');
      console.log(`Transactions in extractedData: ${extracted.transactions?.length || 0}`);
      console.log(`Extraction methods: ${extracted.extractionMethods?.join(', ') || 'Unknown'}`);
      
      if (extracted.transactions && extracted.transactions.length > 0) {
        console.log('\n=== FIRST 5 TRANSACTIONS ===');
        extracted.transactions.slice(0, 5).forEach((t, i) => {
          console.log(`\n${i + 1}. ${t.date} - ${t.description}`);
          console.log(`   Amount: ${t.amount}, Type: ${t.type}, Category: ${t.category}`);
        });
        
        console.log('\n=== LAST 3 TRANSACTIONS ===');
        extracted.transactions.slice(-3).forEach((t, i) => {
          console.log(`\n${extracted.transactions.length - 2 + i}. ${t.date} - ${t.description}`);
          console.log(`   Amount: ${t.amount}, Type: ${t.type}, Category: ${t.category}`);
        });
      }
    } else {
      console.log('\n=== NO EXTRACTED DATA ===');
    }
    
    if (statement.errorLog) {
      console.log('\n=== ERROR LOG ===');
      console.log(statement.errorLog);
    }
    
    // Check actual transactions in database
    const txnCount = await prisma.transaction.count({
      where: {
        statementId: statement.id
      }
    });
    
    console.log(`\n=== TRANSACTIONS IN DATABASE: ${txnCount} ===`);
    
    // Get sample transactions
    const sampleTxns = await prisma.transaction.findMany({
      where: {
        statementId: statement.id
      },
      take: 3,
      orderBy: {
        date: 'asc'
      }
    });
    
    if (sampleTxns.length > 0) {
      console.log('\n=== SAMPLE TRANSACTIONS FROM DB ===');
      sampleTxns.forEach((t, i) => {
        console.log(`\n${i + 1}. ${t.date.toISOString().split('T')[0]} - ${t.description}`);
        console.log(`   Amount: ${t.amount}, Type: ${t.type}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkExtractedData();
