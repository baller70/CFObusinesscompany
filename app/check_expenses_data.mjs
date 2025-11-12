import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function checkExpensesData() {
  try {
    console.log('🔍 CHECKING EXPENSES DATA FOR 2024\n');
    console.log('='.repeat(80));
    
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { 
        businessProfiles: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    const currentProfile = user.currentBusinessProfileId 
      ? await prisma.businessProfile.findUnique({ where: { id: user.currentBusinessProfileId } })
      : null;

    console.log(`\n👤 User: ${user.email}`);
    console.log(`📊 Active Profile: ${currentProfile?.name || 'None'} (${currentProfile?.type || 'N/A'})`);
    console.log(`🏢 Total Profiles: ${user.businessProfiles.length}`);

    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📁 PROFILE: ${profile.name} (${profile.type})`);
      console.log(`${'='.repeat(80)}`);

      // 1. RECURRING CHARGES
      console.log('\n💳 RECURRING CHARGES:');
      const recurringCharges = await prisma.recurringCharge.findMany({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        },
        orderBy: { amount: 'desc' }
      });
      console.log(`   Total: ${recurringCharges.length}`);
      if (recurringCharges.length > 0) {
        console.log('   Top 5:');
        recurringCharges.slice(0, 5).forEach((charge, i) => {
          console.log(`   ${i+1}. ${charge.name} - $${charge.amount.toFixed(2)} ${charge.frequency}`);
        });
      }

      // 2. BILLS TO PAY
      console.log('\n📄 BILLS TO PAY:');
      const bills = await prisma.bill.findMany({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        },
        orderBy: { dueDate: 'asc' }
      });
      console.log(`   Total: ${bills.length}`);
      const unpaidBills = bills.filter(b => b.status === 'UNPAID');
      const paidBills = bills.filter(b => b.status === 'PAID');
      const overdueBills = bills.filter(b => b.status === 'OVERDUE');
      const pendingBills = bills.filter(b => b.status === 'PENDING');
      console.log(`   Pending: ${pendingBills.length} | Unpaid: ${unpaidBills.length} | Paid: ${paidBills.length} | Overdue: ${overdueBills.length}`);
      if (bills.length > 0) {
        console.log('   Recent Bills:');
        bills.slice(0, 5).forEach((bill, i) => {
          console.log(`   ${i+1}. ${bill.description} - $${bill.amount.toFixed(2)} (${bill.status}) Due: ${bill.dueDate.toISOString().split('T')[0]}`);
        });
      }

      // 3. EXPENSE CLAIMS (no businessProfileId field)
      console.log('\n🧾 EXPENSE CLAIMS:');
      const expenseClaims = await prisma.expenseClaim.findMany({
        where: { 
          userId: user.id
        },
        orderBy: { date: 'desc' }
      });
      console.log(`   Total (All Profiles): ${expenseClaims.length}`);
      if (expenseClaims.length > 0) {
        const pendingClaims = expenseClaims.filter(c => c.status === 'PENDING');
        const approvedClaims = expenseClaims.filter(c => c.status === 'APPROVED');
        const rejectedClaims = expenseClaims.filter(c => c.status === 'REJECTED');
        const submittedClaims = expenseClaims.filter(c => c.status === 'SUBMITTED');
        console.log(`   Submitted: ${submittedClaims.length} | Approved: ${approvedClaims.length} | Rejected: ${rejectedClaims.length}`);
        console.log('   Recent Claims:');
        expenseClaims.slice(0, 5).forEach((claim, i) => {
          console.log(`   ${i+1}. ${claim.title} - $${claim.amount.toFixed(2)} (${claim.status}) - ${claim.category || 'N/A'}`);
        });
      }

      // 4. RECEIPTS (no businessProfileId field)
      console.log('\n🧾 RECEIPTS:');
      const receipts = await prisma.receipt.findMany({
        where: { 
          userId: user.id
        },
        orderBy: { date: 'desc' }
      });
      console.log(`   Total (All Profiles): ${receipts.length}`);
      if (receipts.length > 0) {
        console.log('   Recent Receipts:');
        receipts.slice(0, 5).forEach((receipt, i) => {
          console.log(`   ${i+1}. ${receipt.vendor || 'N/A'} - $${receipt.amount.toFixed(2)} - ${receipt.date.toISOString().split('T')[0]}`);
        });
      }

      // Transaction Summary for Expenses
      console.log('\n💰 EXPENSE TRANSACTIONS SUMMARY:');
      const expenseTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          businessProfileId: profile.id,
          type: 'EXPENSE',
          date: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        }
      });
      console.log(`   Total 2024 Expense Transactions: ${expenseTransactions.length}`);
      
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      console.log(`   Total 2024 Expenses: $${totalExpenses.toFixed(2)}`);
      
      // Category breakdown
      const categoryBreakdown = {};
      expenseTransactions.forEach(t => {
        if (!categoryBreakdown[t.category]) {
          categoryBreakdown[t.category] = { count: 0, total: 0 };
        }
        categoryBreakdown[t.category].count++;
        categoryBreakdown[t.category].total += Math.abs(t.amount);
      });
      
      console.log('\n   Top Expense Categories:');
      Object.entries(categoryBreakdown)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)
        .forEach(([cat, data], i) => {
          console.log(`   ${i+1}. ${cat}: ${data.count} transactions, $${data.total.toFixed(2)}`);
        });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ EXPENSES DATA CHECK COMPLETE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExpensesData();
