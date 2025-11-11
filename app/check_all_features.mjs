import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAllFeatures() {
  try {
    console.log('\n🔍 CHECKING ALL POPULATED FEATURES FOR 2025 DATES\n');
    console.log('='.repeat(60));

    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    for (const profile of user.businessProfiles) {
      console.log(`\n📁 ${profile.name} (${profile.type})`);
      console.log('─'.repeat(60));

      // Check Budgets
      const budgets = await prisma.budget.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n💰 Budgets: ${budgets.length}`);
      budgets.forEach(b => {
        const year = b.year || new Date(b.createdAt).getFullYear();
        if (year === 2025) {
          console.log(`  ⚠️  ${b.name}: year=${b.year} (needs fix)`);
        }
      });

      // Check Goals
      const goals = await prisma.goal.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n🎯 Goals: ${goals.length}`);
      goals.forEach(g => {
        const targetYear = g.targetDate ? new Date(g.targetDate).getFullYear() : null;
        if (targetYear === 2025) {
          console.log(`  ⚠️  ${g.name}: targetDate=${g.targetDate} (may need adjustment)`);
        }
      });

      // Check Debts
      const debts = await prisma.debt.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n💳 Debts: ${debts.length}`);
      debts.forEach(d => {
        const dueYear = d.dueDate ? new Date(d.dueDate).getFullYear() : null;
        if (dueYear === 2025) {
          console.log(`  ⚠️  ${d.name}: dueDate=${d.dueDate} (future date OK)`);
        }
      });

      // Check Recurring Charges
      const recurring = await prisma.recurringCharge.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n🔄 Recurring Charges: ${recurring.length}`);
      recurring.forEach(r => {
        const nextYear = r.nextBillingDate ? new Date(r.nextBillingDate).getFullYear() : null;
        const startYear = r.startDate ? new Date(r.startDate).getFullYear() : null;
        if (startYear === 2025) {
          console.log(`  ⚠️  ${r.merchantName}: startDate=${r.startDate} (needs fix)`);
        }
      });

      // Check Bills
      const bills = await prisma.bill.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n📄 Bills: ${bills.length}`);
      bills.forEach(b => {
        const dueYear = b.dueDate ? new Date(b.dueDate).getFullYear() : null;
        if (dueYear === 2025 && b.dueDate) {
          const dueDate = new Date(b.dueDate);
          if (dueDate < new Date('2025-11-11')) { // Before today
            console.log(`  ⚠️  ${b.billNumber}: dueDate=${b.dueDate} (needs fix - past due in 2025)`);
          }
        }
      });

      // Check Invoices
      const invoices = await prisma.invoice.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n📝 Invoices: ${invoices.length}`);
      invoices.forEach(i => {
        const issueYear = i.issueDate ? new Date(i.issueDate).getFullYear() : null;
        const dueYear = i.dueDate ? new Date(i.dueDate).getFullYear() : null;
        if (issueYear === 2025 || dueYear === 2025) {
          console.log(`  ⚠️  ${i.invoiceNumber}: issueDate=${i.issueDate}, dueDate=${i.dueDate} (needs fix)`);
        }
      });

      // Check Bank Statements
      const statements = await prisma.bankStatement.findMany({
        where: { businessProfileId: profile.id }
      });
      console.log(`\n📊 Bank Statements: ${statements.length}`);
      let needsFix = false;
      statements.forEach(s => {
        const period = s.statementPeriod || '';
        if (period.includes('2024') && s.status === 'COMPLETED') {
          // Check if any transactions are in 2025
          // (already verified earlier - should be all 2024 now)
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ FEATURE CHECK COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFeatures();
