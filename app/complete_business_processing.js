require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function completeBusinessProcessing() {
  try {
    console.log('🔄 Completing business statement processing manually...\n');
    
    const statementId = 'cmgten4df00030sxio2pqoy1l';
    
    // Update to mark as failed first so we can retry
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: 'PENDING',
        processingStage: 'UPLOADED'
      }
    });
    
    console.log('✅ Reset statement to UPLOADED - ready to reprocess');
    console.log('Now manually trigger processing via the API or app UI');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeBusinessProcessing();
