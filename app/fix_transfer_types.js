require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTransferTypes() {
  try {
    console.log('Fixing incorrectly classified TRANSFER transactions...\n');
    
    // Find all TRANSFER transactions
    const transfers = await prisma.transaction.findMany({
      where: { type: 'TRANSFER' },
      include: {
        bankStatement: {
          select: {
            extractedData: true,
            fileName: true
          }
        }
      }
    });
    
    console.log(`Found ${transfers.length} TRANSFER transactions to review\n`);
    
    let fixedCount = 0;
    
    for (const txn of transfers) {
      const desc = txn.description?.toLowerCase() || '';
      
      // Check if this is a payment processor transfer (which should be INCOME)
      const isPaymentProcessor = 
        desc.includes('stripe') || 
        desc.includes('paypal') || 
        desc.includes('venmo') || 
        desc.includes('zelle') ||
        desc.includes('payout') ||
        desc.includes('payment');
      
      if (isPaymentProcessor) {
        // Get the original transaction data from extractedData
        const extractedData = txn.bankStatement?.extractedData;
        if (extractedData && extractedData.transactions) {
          const originalTxn = extractedData.transactions.find(
            t => t.description === txn.description
          );
          
          // Determine correct type based on AI's classification
          let correctType = 'INCOME';
          if (originalTxn?.type) {
            const txnType = originalTxn.type.toLowerCase();
            if (txnType === 'credit' || txnType === 'deposit') {
              correctType = 'INCOME';
            } else if (txnType === 'debit' || txnType === 'withdrawal') {
              correctType = 'EXPENSE';
            }
          }
          
          // Update the transaction
          await prisma.transaction.update({
            where: { id: txn.id },
            data: { type: correctType }
          });
          
          console.log(`✓ Fixed: ${txn.description?.substring(0, 50)} → ${correctType}`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} transactions`);
    console.log(`ℹ️ ${transfers.length - fixedCount} transactions remain as TRANSFER (internal transfers)`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixTransferTypes();
