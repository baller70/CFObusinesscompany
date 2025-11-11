require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateSimple(userId, businessProfileId, profileType) {
  console.log(`\n[Populator] Starting population for ${profileType}...`);
  
  try {
    const transactions = await prisma.transaction.findMany({
      where: { businessProfileId },
      include: { categoryRelation: true },
      orderBy: { date: 'desc' }
    });
    
    console.log(`[Populator] Found ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      console.log('[Populator] ⚠️  No transactions');
      return;
    }
    
    // BUDGETS
    console.log('[Populator] 💰 Creating budgets...');
    const catSpending = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const cat = t.categoryRelation?.name || t.category || 'Other';
      catSpending[cat] = (catSpending[cat] || 0) + Math.abs(t.amount);
    });
    
    let budgetCount = 0;
    for (const [category, total] of Object.entries(catSpending)) {
      try {
        const suggested = Math.ceil(total * 1.1);
        if (suggested > 100) {
          await prisma.budget.create({
            data: {
              userId,
              businessProfileId,
              name: `${category} Budget`,
              category,
              amount: suggested,
              month: 11,
              year: 2025,
              type: 'MONTHLY',
              spent: 0
            }
          });
          budgetCount++;
        }
      } catch (e) {
        // Skip if already exists
      }
    }
    console.log(`[Populator] ✅ Created ${budgetCount} budgets`);
    
    // GOALS
    console.log('[Populator] 🎯 Creating goals...');
    const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    let goalCount = 0;
    if (income > 1000) {
      try {
        await prisma.goal.create({
          data: {
            userId,
            businessProfileId,
            name: `Savings Goal - ${profileType}`,
            targetAmount: Math.ceil(income * 0.2),
            currentAmount: 0,
            type: 'SAVINGS',
            priority: 1,
            isCompleted: false
          }
        });
        goalCount++;
      } catch (e) {}
      
      try {
        await prisma.goal.create({
          data: {
            userId,
            businessProfileId,
            name: `Emergency Fund - ${profileType}`,
            targetAmount: Math.ceil(income * 0.3),
            currentAmount: 0,
            type: 'EMERGENCY',
            priority: 2,
            isCompleted: false
          }
        });
        goalCount++;
      } catch (e) {}
    }
    console.log(`[Populator] ✅ Created ${goalCount} goals`);
    
    // DEBTS
    console.log('[Populator] 💳 Creating debts...');
    const debts = new Set();
    let debtCount = 0;
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const desc = (t.description || '').toLowerCase();
      if ((desc.includes('loan') || desc.includes('payment') || desc.includes('mortgage')) && Math.abs(t.amount) > 200) {
        debts.add(t.description?.substring(0, 40) || 'Debt Payment');
      }
    });
    
    for (const debtName of Array.from(debts).slice(0, 5)) {
      try {
        await prisma.debt.create({
          data: {
            userId,
            businessProfileId,
            name: debtName,
            balance: Math.floor(Math.random() * 10000) + 5000,
            interestRate: 5.5,
            minimumPayment: 500,
            dueDay: 15,
            type: 'OTHER'
          }
        });
        debtCount++;
      } catch (e) {}
    }
    console.log(`[Populator] ✅ Created ${debtCount} debts`);
    
    // RECURRING CHARGES
    console.log('[Populator] 🔄 Creating recurring charges...');
    const merchants = {};
    transactions.forEach(t => {
      const merchant = (t.description || '').split(/[0-9]/)[0].trim().substring(0, 25);
      if (merchant.length > 4) {
        merchants[merchant] = (merchants[merchant] || []);
        merchants[merchant].push(t);
      }
    });
    
    let recurringCount = 0;
    for (const [merchant, txs] of Object.entries(merchants)) {
      if (txs.length >= 2) {
        try {
          const avg = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txs.length;
          await prisma.recurringCharge.create({
            data: {
              userId,
              businessProfileId,
              name: merchant,
              amount: avg,
              frequency: 'MONTHLY',
              category: txs[0].categoryRelation?.name || txs[0].category || 'Other',
              nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              isActive: true
            }
          });
          recurringCount++;
        } catch (e) {}
      }
    }
    console.log(`[Populator] ✅ Created ${recurringCount} recurring charges`);
    
    // INVOICES
    console.log('[Populator] 📑 Creating invoices...');
    const incomes = transactions.filter(t => t.type === 'INCOME' && t.amount > 100).slice(0, 10);
    let invoiceCount = 0;
    for (const tx of incomes) {
      try {
        await prisma.invoice.create({
          data: {
            userId,
            businessProfileId,
            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            customerName: tx.description?.substring(0, 40) || 'Customer',
            amount: tx.amount,
            issueDate: new Date(tx.date),
            dueDate: new Date(tx.date),
            status: 'PAID',
            items: [{
              description: `Payment: ${tx.description}`,
              quantity: 1,
              unitPrice: tx.amount,
              total: tx.amount
            }]
          }
        });
        invoiceCount++;
      } catch (e) {}
    }
    console.log(`[Populator] ✅ Created ${invoiceCount} invoices`);
    
    // CUSTOMERS
    console.log('[Populator] 👥 Creating customers...');
    const customers = new Set();
    transactions.filter(t => t.type === 'INCOME').forEach(t => {
      const name = (t.description || '').split(/[0-9]/)[0].trim().substring(0, 40);
      if (name.length > 4) customers.add(name);
    });
    
    let customerCount = 0;
    for (const name of Array.from(customers).slice(0, 10)) {
      try {
        await prisma.customer.create({
          data: {
            userId,
            businessProfileId,
            name,
            email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15)}@example.com`,
            status: 'ACTIVE'
          }
        });
        customerCount++;
      } catch (e) {}
    }
    console.log(`[Populator] ✅ Created ${customerCount} customers`);
    
    // VENDORS
    console.log('[Populator] 🏢 Creating vendors...');
    const vendors = new Set();
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const name = (t.description || '').split(/[0-9]/)[0].trim().substring(0, 40);
      if (name.length > 4) vendors.add(name);
    });
    
    let vendorCount = 0;
    for (const name of Array.from(vendors).slice(0, 15)) {
      try {
        await prisma.vendor.create({
          data: {
            userId,
            businessProfileId,
            name,
            email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15)}@example.com`,
            status: 'ACTIVE'
          }
        });
        vendorCount++;
      } catch (e) {}
    }
    console.log(`[Populator] ✅ Created ${vendorCount} vendors`);
    
    // BILLS
    console.log('[Populator] 📄 Creating bills...');
    const expenses = transactions.filter(t => t.type === 'EXPENSE' && Math.abs(t.amount) > 150).slice(0, 10);
    let billCount = 0;
    for (const tx of expenses) {
      try {
        await prisma.bill.create({
          data: {
            userId,
            businessProfileId,
            vendorName: tx.description?.substring(0, 40) || 'Vendor',
            amount: Math.abs(tx.amount),
            dueDate: new Date(tx.date),
            status: 'PAID',
            category: tx.categoryRelation?.name || tx.category || 'Other',
            description: `Bill: ${tx.description}`
          }
        });
        billCount++;
      } catch (e) {}
    }
    console.log(`[Populator] ✅ Created ${billCount} bills`);
    
    console.log(`\n[Populator] ✅ DONE for ${profileType}!\n`);
    
  } catch (error) {
    console.error(`[Populator] ❌ Error:`, error.message);
  }
}

async function main() {
  console.log('\n🚀 COMPREHENSIVE FEATURE POPULATION');
  console.log('=' .repeat(60) + '\n');
  
  const user = await prisma.user.findUnique({
    where: { email: 'khouston@thebasketballfactorynj.com' },
    include: { businessProfiles: true }
  });
  
  if (!user) {
    console.log('❌ User not found');
    return;
  }
  
  console.log(`📊 User: ${user.email}`);
  console.log(`🏢 Profiles: ${user.businessProfiles.length}`);
  
  for (const profile of user.businessProfiles) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 ${profile.name} (${profile.type})`);
    console.log(`${'='.repeat(60)}`);
    
    await populateSimple(user.id, profile.id, profile.type);
  }
  
  // Show results
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60) + '\n');
  
  for (const profile of user.businessProfiles) {
    console.log(`\n${profile.name} (${profile.type}):`);
    
    const counts = {
      transactions: await prisma.transaction.count({ where: { businessProfileId: profile.id } }),
      budgets: await prisma.budget.count({ where: { businessProfileId: profile.id } }),
      goals: await prisma.goal.count({ where: { businessProfileId: profile.id } }),
      debts: await prisma.debt.count({ where: { businessProfileId: profile.id } }),
      recurringCharges: await prisma.recurringCharge.count({ where: { businessProfileId: profile.id } }),
      invoices: await prisma.invoice.count({ where: { businessProfileId: profile.id } }),
      customers: await prisma.customer.count({ where: { businessProfileId: profile.id } }),
      vendors: await prisma.vendor.count({ where: { businessProfileId: profile.id } }),
      bills: await prisma.bill.count({ where: { businessProfileId: profile.id } }),
    };
    
    console.log(`  ✅ Transactions: ${counts.transactions}`);
    console.log(`  ✅ Budgets: ${counts.budgets}`);
    console.log(`  ✅ Goals: ${counts.goals}`);
    console.log(`  ✅ Debts: ${counts.debts}`);
    console.log(`  ✅ Recurring Charges: ${counts.recurringCharges}`);
    console.log(`  ✅ Invoices: ${counts.invoices}`);
    console.log(`  ✅ Customers: ${counts.customers}`);
    console.log(`  ✅ Vendors: ${counts.vendors}`);
    console.log(`  ✅ Bills: ${counts.bills}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ POPULATION COMPLETE!');
  console.log('='.repeat(60) + '\n');
  
  await prisma.$disconnect();
}

main().catch(console.error);
