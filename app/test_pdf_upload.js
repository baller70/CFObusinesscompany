require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    console.log('Testing PDF upload and processing...\n');
    
    // First, let's check if there are any FAILED statements
    const failedStmts = await prisma.bankStatement.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    
    if (failedStmts.length > 0) {
      console.log(`Found ${failedStmts.length} failed statements. Attempting to reprocess...\n`);
      
      // Import the processor
      const { processStatement } = require('./lib/statement-processor.ts');
      
      for (const stmt of failedStmts) {
        console.log(`\nReprocessing: ${stmt.fileName}`);
        console.log(`Statement ID: ${stmt.id}`);
        
        // Update status back to PENDING
        await prisma.bankStatement.update({
          where: { id: stmt.id },
          data: {
            status: 'PENDING',
            processingStage: 'UPLOADED',
            errorLog: null
          }
        });
        
        try {
          // Process the statement
          await processStatement(stmt.id);
          console.log(`✅ Successfully reprocessed: ${stmt.fileName}`);
        } catch (error) {
          console.error(`❌ Failed to reprocess: ${error.message}`);
        }
      }
      
      // Check results
      console.log('\n\n=== Checking Results ===\n');
      for (const stmt of failedStmts) {
        const updated = await prisma.bankStatement.findUnique({
          where: { id: stmt.id },
          include: {
            transactions: {
              take: 5
            }
          }
        });
        
        console.log(`\nFile: ${updated.fileName}`);
        console.log(`Status: ${updated.status}`);
        console.log(`Processing Stage: ${updated.processingStage}`);
        console.log(`Transactions Created: ${updated.transactions.length}`);
        if (updated.errorLog) {
          console.log(`Error: ${updated.errorLog}`);
        }
      }
    } else {
      console.log('No failed statements found. All uploads are successful!');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Test error:', error);
    await prisma.$disconnect();
  }
}

testUpload();
