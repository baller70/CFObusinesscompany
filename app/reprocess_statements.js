
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reprocessStatements() {
  try {
    console.log('🔄 Starting statement reprocessing with cross-profile routing...\n');
    
    // Get all statements
    const statements = await prisma.bankStatement.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        user: true,
        businessProfile: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`📄 Found ${statements.length} completed statements to reprocess\n`);
    
    for (const statement of statements) {
      console.log(`\n📊 Reprocessing: ${statement.fileName}`);
      console.log(`   Original profile: ${statement.businessProfile?.name || 'None'}`);
      console.log(`   Statement ID: ${statement.id}`);
      
      // Delete existing transactions for this statement
      const deletedCount = await prisma.transaction.deleteMany({
        where: { bankStatementId: statement.id }
      });
      console.log(`   🗑️  Deleted ${deletedCount.count} existing transactions`);
      
      // Delete existing recurring charges for this statement
      const deletedCharges = await prisma.recurringCharge.deleteMany({
        where: { 
          userId: statement.userId,
          createdAt: {
            gte: statement.createdAt
          }
        }
      });
      console.log(`   🗑️  Deleted ${deletedCharges.count} existing recurring charges`);
      
      // Reset statement status to uploaded (will trigger reprocessing)
      await prisma.bankStatement.update({
        where: { id: statement.id },
        data: {
          status: 'PENDING',
          processingStage: 'UPLOADED',
          processedAt: null,
          processedCount: 0,
          transactionCount: 0
        }
      });
      
      console.log(`   ✅ Reset statement to PENDING status`);
    }
    
    console.log('\n\n🎯 All statements reset. Now triggering reprocessing...\n');
    
    // Trigger processing for each statement
    for (const statement of statements) {
      console.log(`\n🚀 Triggering processing for: ${statement.fileName}`);
      
      try {
        const response = await fetch(`http://localhost:3000/api/bank-statements/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            statementId: statement.id
          })
        });
        
        if (response.ok) {
          console.log(`   ✅ Processing triggered successfully`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Failed to trigger processing: ${errorText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error triggering processing: ${error.message}`);
      }
      
      // Wait a bit between statements
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n\n✅ Reprocessing complete! Check the app to see the results.');
    
  } catch (error) {
    console.error('❌ Error during reprocessing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reprocessStatements();
