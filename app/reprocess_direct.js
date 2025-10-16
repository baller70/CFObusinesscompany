
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reprocessStatements() {
  try {
    console.log('🔄 Starting direct statement reprocessing with cross-profile routing...\n');
    
    // Get all statements
    const statements = await prisma.bankStatement.findMany({
      where: {
        status: 'PENDING',
        processingStage: 'UPLOADED'
      },
      include: {
        user: true,
        businessProfile: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📄 Found ${statements.length} statements ready for processing\n`);
    
    if (statements.length === 0) {
      console.log('✅ No statements to process!');
      return;
    }
    
    // Import the processing function
    const { processStatement } = require('./lib/statement-processor.ts');
    
    for (const statement of statements) {
      console.log(`\n🚀 Processing: ${statement.fileName}`);
      console.log(`   Profile: ${statement.businessProfile?.name || 'None'}`);
      console.log(`   Statement ID: ${statement.id}`);
      
      try {
        await processStatement(statement.id);
        console.log(`   ✅ Processing completed successfully!`);
      } catch (error) {
        console.log(`   ❌ Processing failed: ${error.message}`);
      }
    }
    
    console.log('\n\n✅ All statements processed! Checking results...\n');
    
    // Check results
    const processedStatements = await prisma.bankStatement.findMany({
      where: {
        id: {
          in: statements.map(s => s.id)
        }
      },
      include: {
        _count: {
          select: { transactions: true }
        },
        businessProfile: true
      }
    });
    
    for (const stmt of processedStatements) {
      console.log(`📊 ${stmt.fileName}`);
      console.log(`   Status: ${stmt.status}`);
      console.log(`   Transactions: ${stmt._count.transactions}`);
      console.log(`   Profile: ${stmt.businessProfile?.name || 'None'}`);
    }
    
    // Check transaction distribution
    console.log('\n\n📈 Transaction Distribution by Profile:\n');
    
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { 
        userId: statements[0].userId,
        type: 'BUSINESS'
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    const personalProfile = await prisma.businessProfile.findFirst({
      where: { 
        userId: statements[0].userId,
        type: 'PERSONAL'
      },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });
    
    if (businessProfile) {
      console.log(`🏢 ${businessProfile.name}: ${businessProfile._count.transactions} transactions`);
    }
    
    if (personalProfile) {
      console.log(`🏠 ${personalProfile.name}: ${personalProfile._count.transactions} transactions`);
    }
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reprocessStatements();
