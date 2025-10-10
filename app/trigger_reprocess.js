require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function triggerReprocess() {
  try {
    console.log('Resetting failed statements to PENDING...\n');
    
    const result = await prisma.bankStatement.updateMany({
      where: { status: 'FAILED' },
      data: {
        status: 'PENDING',
        processingStage: 'UPLOADED',
        errorLog: null
      }
    });
    
    console.log(`✅ Reset ${result.count} failed statements to PENDING`);
    console.log('\n📌 Next steps:');
    console.log('1. Start the dev server: cd /home/ubuntu/cfo_budgeting_app/app && yarn dev');
    console.log('2. The statements will be automatically reprocessed on the next page load/refresh');
    console.log('3. Or manually trigger by calling the upload endpoint again');
    
    // Get the statement IDs
    const statements = await prisma.bankStatement.findMany({
      where: { 
        processingStage: 'UPLOADED',
        status: 'PENDING'
      },
      select: { id: true, fileName: true }
    });
    
    console.log('\n📋 Statements ready for reprocessing:');
    statements.forEach(stmt => {
      console.log(`   - ${stmt.fileName} (${stmt.id})`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

triggerReprocess();
