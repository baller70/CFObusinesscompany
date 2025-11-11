import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

async function fixRouting() {
  try {
    console.log('Starting routing fix...\n');

    // Get the user
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log(`Found user: ${user.email}`);

    // Get both profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id }
    });

    const businessProfile = profiles.find(p => p.type === 'BUSINESS');
    const personalProfile = profiles.find(p => p.type === 'PERSONAL');

    console.log(`\nFound profiles:`);
    console.log(`- Business: ${businessProfile?.name} (${businessProfile?.id})`);
    console.log(`- Personal: ${personalProfile?.name} (${personalProfile?.id})`);

    // Get all transactions
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        description: true,
        category: true,
        businessProfileId: true,
        amount: true,
        type: true
      }
    });

    console.log(`\nTotal transactions: ${allTransactions.length}`);

    // Analyze and fix routing
    let movedToBusiness = 0;
    let movedToPersonal = 0;
    let unchanged = 0;

    for (const txn of allTransactions) {
      const desc = txn.description.toLowerCase();
      const cat = txn.category.toLowerCase();

      // Business indicators
      const isBusinessTransaction = 
        // Business categories
        cat.includes('office') ||
        cat.includes('software') ||
        cat.includes('marketing') ||
        cat.includes('professional') ||
        cat.includes('legal') ||
        cat.includes('accounting') ||
        cat.includes('equipment') ||
        cat.includes('business') ||
        cat.includes('contractor') ||
        cat.includes('client') ||
        cat.includes('advertising') ||
        // Business merchants
        desc.includes('stripe') ||
        desc.includes('aws') ||
        desc.includes('square') ||
        desc.includes('paypal business') ||
        desc.includes('office depot') ||
        desc.includes('staples') ||
        desc.includes('linkedin') ||
        desc.includes('adobe') ||
        desc.includes('microsoft 365') ||
        desc.includes('salesforce') ||
        desc.includes('quickbooks') ||
        desc.includes('merchant services') ||
        desc.includes('pos') ||
        desc.includes('website') ||
        desc.includes('hosting') ||
        desc.includes('domain');

      // Personal indicators
      const isPersonalTransaction =
        // Personal categories
        cat.includes('groceries') ||
        cat.includes('dining') ||
        cat.includes('restaurant') ||
        cat.includes('entertainment') ||
        cat.includes('healthcare') ||
        cat.includes('personal') ||
        cat.includes('shopping') ||
        cat.includes('fitness') ||
        cat.includes('wellness') ||
        cat.includes('hobbies') ||
        cat.includes('home') ||
        cat.includes('utilities') ||
        cat.includes('rent') ||
        cat.includes('mortgage') ||
        // Personal merchants
        desc.includes('whole foods') ||
        desc.includes('safeway') ||
        desc.includes('target') ||
        desc.includes('walmart') ||
        desc.includes('netflix') ||
        desc.includes('spotify') ||
        desc.includes('gym') ||
        desc.includes('doctor') ||
        desc.includes('pharmacy') ||
        desc.includes('cvs') ||
        desc.includes('walgreens');

      let targetProfileId = null;

      if (isBusinessTransaction && businessProfile) {
        targetProfileId = businessProfile.id;
        if (txn.businessProfileId !== targetProfileId) {
          movedToBusiness++;
          console.log(`🏢 Moving to BUSINESS: ${txn.description}`);
        } else {
          unchanged++;
        }
      } else if (isPersonalTransaction && personalProfile) {
        targetProfileId = personalProfile.id;
        if (txn.businessProfileId !== targetProfileId) {
          movedToPersonal++;
          console.log(`🏠 Moving to PERSONAL: ${txn.description}`);
        } else {
          unchanged++;
        }
      } else {
        unchanged++;
        continue;
      }

      // Update the transaction
      if (txn.businessProfileId !== targetProfileId) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: { businessProfileId: targetProfileId }
        });
      }
    }

    console.log(`\n✅ Routing fix complete:`);
    console.log(`- Moved to Business: ${movedToBusiness}`);
    console.log(`- Moved to Personal: ${movedToPersonal}`);
    console.log(`- Unchanged: ${unchanged}`);

    // Show current distribution
    const businessTxns = await prisma.transaction.count({
      where: { 
        userId: user.id,
        businessProfileId: businessProfile?.id
      }
    });

    const personalTxns = await prisma.transaction.count({
      where: { 
        userId: user.id,
        businessProfileId: personalProfile?.id
      }
    });

    console.log(`\n📊 Current distribution:`);
    console.log(`- Business transactions: ${businessTxns}`);
    console.log(`- Personal transactions: ${personalTxns}`);

  } catch (error) {
    console.error('Error fixing routing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRouting();
