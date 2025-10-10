require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCheck() {
  try {
    console.log('\n=== PDF PROCESSING STATUS CHECK ===\n');
    
    const allStmts = await prisma.bankStatement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        _count: {
          select: { transactions: true }
        }
        }
    });
    
    if (allStmts.length === 0) {
      console.log('No statements found in database.');
    } else {
      console.log(`Total statements: ${allStmts.length}\n`);
      
      const completed = allStmts.filter(s => s.status === 'COMPLETED').length;
      const pending = allStmts.filter(s => s.status === 'PENDING').length;
      const processing = allStmts.filter(s => s.status === 'PROCESSING').length;
      const failed = allStmts.filter(s => s.status === 'FAILED').length;
      
      console.log('📊 Status Summary:');
      console.log(`   ✅ Completed: ${completed}`);
      console.log(`   ⏳ Processing: ${processing}`);
      console.log(`   📄 Pending: ${pending}`);
      console.log(`   ❌ Failed: ${failed}`);
      
      console.log('\n📋 Recent Statements:\n');
      allStmts.forEach((stmt, idx) => {
        const statusIcon = stmt.status === 'COMPLETED' ? '✅' : 
                          stmt.status === 'FAILED' ? '❌' : 
                          stmt.status === 'PROCESSING' ? '⏳' : '📄';
        
        console.log(`${idx + 1}. ${statusIcon} ${stmt.fileName}`);
        console.log(`   Status: ${stmt.status} | Stage: ${stmt.processingStage}`);
        console.log(`   Transactions: ${stmt._count.transactions}`);
        if (stmt.bankName) console.log(`   Bank: ${stmt.bankName}`);
        if (stmt.errorLog) console.log(`   ⚠️  Error: ${stmt.errorLog}`);
        console.log('');
      });
      
      console.log('\n💡 Note: The PDF processing fix has been implemented.');
      console.log('   - Upload processing now uses direct module import instead of API calls');
      console.log('   - Improved error handling and logging');
      console.log('   - Background processing with proper async handling\n');
      
      if (pending > 0 || processing > 0) {
        console.log('⚠️  There are pending/processing statements.');
        console.log('   These will be processed when you:');
        console.log('   1. Upload new files through the UI');
        console.log('   2. Or navigate to the bank statements page which will trigger processing\n');
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

finalCheck();
