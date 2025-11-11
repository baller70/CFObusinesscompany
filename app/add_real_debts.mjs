import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function addRealDebts() {
  try {
    console.log('\n💳 ADDING REAL DEBT INFORMATION\n');
    console.log('=' .repeat(60));

    // Get user and business profile
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
    
    if (!businessProfile) {
      console.log('❌ No business profile found');
      return;
    }

    console.log(`\n🏢 Business Profile: ${businessProfile.name}`);
    console.log(`📊 Profile ID: ${businessProfile.id}`);

    // Clear existing auto-generated debts
    console.log('\n' + '='.repeat(60));
    console.log('🗑️  CLEARING AUTO-GENERATED DEBTS');
    console.log('='.repeat(60));

    const existingDebts = await prisma.debt.findMany({
      where: { businessProfileId: businessProfile.id }
    });

    console.log(`Found ${existingDebts.length} existing debts`);
    
    for (const debt of existingDebts) {
      await prisma.debt.delete({ where: { id: debt.id } });
      console.log(`  🗑️  Deleted: ${debt.name}`);
    }

    // Add real debts
    console.log('\n' + '='.repeat(60));
    console.log('➕ ADDING REAL DEBT INFORMATION');
    console.log('='.repeat(60));

    const debtsToAdd = [
      {
        name: 'Business Line of Credit ($75,000 limit)',
        type: 'OTHER',
        balance: 0,
        interestRate: 0,
        minimumPayment: 0,
        dueDate: 15, // 15th of each month
        priority: 1,
        isActive: true
      },
      {
        name: 'Business Credit Card #1 ($50,000 limit)',
        type: 'CREDIT_CARD',
        balance: 9772.80,
        interestRate: 18.99, // Typical business credit card rate
        minimumPayment: 195.46, // ~2% of balance
        dueDate: 15, // 15th of each month
        priority: 5,
        isActive: true
      },
      {
        name: 'Business Credit Card #2 ($27,000 limit)',
        type: 'CREDIT_CARD',
        balance: 9866.25,
        interestRate: 19.99, // Typical business credit card rate
        minimumPayment: 197.33, // ~2% of balance
        dueDate: 15, // 15th of each month
        priority: 5,
        isActive: true
      },
      {
        name: 'Commercial Commitment Line of Credit ($50,000 limit)',
        type: 'OTHER',
        balance: 0,
        interestRate: 0,
        minimumPayment: 0,
        dueDate: 15, // 15th of each month
        priority: 1,
        isActive: true
      },
      {
        name: 'Business Loan ($200,000)',
        type: 'PERSONAL_LOAN',
        balance: 200000,
        interestRate: 6.5, // Typical commercial loan rate
        minimumPayment: 1000,
        dueDate: 1, // 1st of each month
        priority: 10,
        isActive: true
      }
    ];

    let created = 0;

    for (const debtData of debtsToAdd) {
      try {
        const debt = await prisma.debt.create({
          data: {
            ...debtData,
            userId: user.id,
            businessProfileId: businessProfile.id
          }
        });
        
        console.log(`  ✅ Created: ${debt.name}`);
        console.log(`     Balance Owed: $${debt.balance.toLocaleString()}`);
        console.log(`     Interest Rate: ${debt.interestRate}%`);
        console.log(`     Monthly Payment: $${debt.minimumPayment.toLocaleString()}`);
        console.log(`     Due Date: ${debt.dueDate}${debt.dueDate === 1 ? 'st' : debt.dueDate === 15 ? 'th' : 'th'} of month`);
        console.log('');
        created++;
      } catch (error) {
        console.error(`  ❌ Failed to create ${debtData.name}:`, error.message);
      }
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📊 DEBT SUMMARY');
    console.log('='.repeat(60));

    const allDebts = await prisma.debt.findMany({
      where: { businessProfileId: businessProfile.id }
    });

    const totalOwed = allDebts.reduce((sum, d) => sum + parseFloat(d.balance || 0), 0);
    const totalMonthlyPayment = allDebts.reduce((sum, d) => sum + parseFloat(d.minimumPayment || 0), 0);
    
    // Calculate total credit available (for credit cards and LOCs)
    const creditAccounts = allDebts.filter(d => d.type === 'CREDIT_CARD' || d.type === 'LINE_OF_CREDIT');
    const totalCreditLimit = 75000 + 50000 + 27000 + 50000; // Sum of all limits
    const availableCredit = totalCreditLimit - creditAccounts.reduce((sum, d) => sum + parseFloat(d.balance || 0), 0);

    console.log(`\n💳 Total Credit Available: $${totalCreditLimit.toLocaleString()}`);
    console.log(`💰 Total Amount Owed: $${totalOwed.toLocaleString()}`);
    console.log(`✅ Available Credit: $${availableCredit.toLocaleString()}`);
    console.log(`📅 Total Monthly Payments: $${totalMonthlyPayment.toLocaleString()}`);
    console.log(`📊 Credit Utilization: ${((creditAccounts.reduce((sum, d) => sum + d.balance, 0) / totalCreditLimit) * 100).toFixed(1)}%`);

    console.log('\n' + '='.repeat(60));
    console.log(`✅ COMPLETE - ${created} debts added successfully!`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRealDebts();
