require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reprocessFailed() {
  try {
    console.log('Checking for failed statements...\n');
    
    const failedStmts = await prisma.bankStatement.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (failedStmts.length === 0) {
      console.log('✅ No failed statements found. All uploads are successful!');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`Found ${failedStmts.length} failed statements:\n`);
    failedStmts.forEach((stmt, idx) => {
      console.log(`${idx + 1}. ${stmt.fileName}`);
      console.log(`   ID: ${stmt.id}`);
      console.log(`   Error: ${stmt.errorLog}`);
      console.log('');
    });
    
    // Load the processor module using dynamic import since it's TypeScript
    console.log('\nAttempting to reprocess failed statements...\n');
    
    for (const stmt of failedStmts) {
      console.log(`\n📄 Processing: ${stmt.fileName}`);
      console.log(`   Statement ID: ${stmt.id}`);
      
      // Reset status
      await prisma.bankStatement.update({
        where: { id: stmt.id },
        data: {
          status: 'PENDING',
          processingStage: 'UPLOADED',
          errorLog: null
        }
      });
      
      // Trigger processing via direct module import
      try {
        // We'll use a fetch call to the process API endpoint since it's easier
        console.log('   Triggering processing...');
        
        // Import and call the processor directly
        const { processStatement } = require('./lib/statement-processor');
        
        // Process in background
        setTimeout(async () => {
          try {
            await processStatement(stmt.id);
          } catch (err) {
            console.error(`   Background processing error for ${stmt.fileName}:`, err.message);
          }
        }, 1000);
        
        console.log('   ✅ Processing initiated');
      } catch (error) {
        console.error(`   ❌ Failed to initiate: ${error.message}`);
      }
    }
    
    console.log('\n\n⏳ Processing initiated. Waiting 30 seconds for results...\n');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Check results
    console.log('=== Final Results ===\n');
    for (const stmt of failedStmts) {
      const updated = await prisma.bankStatement.findUnique({
        where: { id: stmt.id },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });
      
      console.log(`\n📄 ${updated.fileName}`);
      console.log(`   Status: ${updated.status}`);
      console.log(`   Stage: ${updated.processingStage}`);
      console.log(`   Transactions: ${updated._count.transactions}`);
      if (updated.errorLog) {
        console.log(`   Error: ${updated.errorLog}`);
      }
    }
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

reprocessFailed();
