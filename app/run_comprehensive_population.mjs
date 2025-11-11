
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function populateAllFeatures() {
  console.log('\n🚀 RUNNING COMPREHENSIVE FEATURE POPULATION\n');
  console.log('='.repeat(60));
  
  try {
    // Get user and profiles
    const user = await prisma.user.findFirst({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('\n👤 User:', user.email);
    console.log('📊 Profiles:', user.businessProfiles.length);
    
    for (const profile of user.businessProfiles) {
      console.log(`\n📍 Populating: ${profile.name} (${profile.type})`);
      console.log('━'.repeat(60));
      
      // Get transactions for this profile
      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        include: { categoryRelation: true },
        orderBy: { date: 'desc' }
      });
      
      console.log(`   Found ${transactions.length} transactions`);
      
      if (transactions.length === 0) {
        console.log('   ⚠️  No transactions found, skipping...');
        continue;
      }
      
      // 1. POPULATE CATEGORIES from transactions
      console.log('\n   📁 Creating Categories...');
      const uniqueCategories = [...new Set(transactions.map(t => t.categoryRelation?.name || t.category).filter(Boolean))];
      let categoryCount = 0;
      for (const catName of uniqueCategories) {
        const existing = await prisma.category.findFirst({
          where: {
            name: catName,
            businessProfileId: profile.id
          }
        });
        
        if (!existing) {
          await prisma.category.create({
            data: {
              name: catName,
              type: 'EXPENSE',
              color: '#3b82f6',
              icon: 'DollarSign',
              businessProfileId: profile.id,
              userId: user.id
            }
          });
          categoryCount++;
        }
      }
      console.log(`   ✅ Categories: ${categoryCount} created`);
      
      // 2. POPULATE GOALS
      console.log('\n   🎯 Creating Financial Goals...');
      const totalExpenses = transactions
        .filter(t => t.type === 'EXPENSE' && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const avgMonthlyExpense = totalExpenses / 12;
      
      const goals = [
        {
          name: 'Emergency Fund',
          type: profile.type === 'BUSINESS' ? 'SAVINGS' : 'SAVINGS',
          targetAmount: avgMonthlyExpense * 6,
          currentAmount: avgMonthlyExpense * 2,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isCompleted: false
        },
        {
          name: 'Reduce Monthly Expenses',
          type: 'SAVINGS',
          targetAmount: avgMonthlyExpense * 0.8,
          currentAmount: avgMonthlyExpense,
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          isCompleted: false
        }
      ];
      
      let goalsCreated = 0;
      for (const goal of goals) {
        const existing = await prisma.goal.findFirst({
          where: {
            name: goal.name,
            businessProfileId: profile.id
          }
        });
        
        if (!existing) {
          await prisma.goal.create({
            data: {
              ...goal,
              businessProfileId: profile.id,
              userId: user.id
            }
          });
          goalsCreated++;
        }
      }
      console.log(`   ✅ Goals: ${goalsCreated} created`);
      
      // 3. POPULATE DEBTS
      console.log('\n   💳 Creating Debts...');
      const recurringExpenses = transactions.filter(t => 
        t.type === 'EXPENSE' && 
        t.amount < 0 &&
        (t.description?.toLowerCase().includes('loan') ||
         t.description?.toLowerCase().includes('payment') ||
         t.description?.toLowerCase().includes('credit'))
      );
      
      const debts = [];
      const processedNames = new Set();
      
      for (const tx of recurringExpenses.slice(0, 5)) {
        const debtName = tx.description?.split(' ').slice(0, 3).join(' ') || 'Debt Payment';
        if (processedNames.has(debtName)) continue;
        processedNames.add(debtName);
        
        debts.push({
          name: debtName,
          type: 'CREDIT_CARD',
          balance: Math.abs(tx.amount) * 8,
          interestRate: 15.99,
          minimumPayment: Math.abs(tx.amount),
          dueDate: 15, // Day of month
          isActive: true
        });
      }
      
      let debtsCreated = 0;
      for (const debt of debts) {
        const existing = await prisma.debt.findFirst({
          where: {
            name: debt.name,
            businessProfileId: profile.id
          }
        });
        
        if (!existing) {
          await prisma.debt.create({
            data: {
              ...debt,
              businessProfileId: profile.id,
              userId: user.id
            }
          });
          debtsCreated++;
        }
      }
      console.log(`   ✅ Debts: ${debtsCreated} created`);
      
      // 4. POPULATE BILLS
      console.log('\n   📄 Creating Bills...');
      const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE' && t.amount < 0);
      const bills = [];
      
      for (const tx of expenseTransactions.slice(0, 10)) {
        bills.push({
          title: tx.description || 'Expense Payment',
          amount: Math.abs(tx.amount),
          dueDate: new Date(tx.date.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: 'UNPAID',
          category: tx.categoryRelation?.name || tx.category || 'Uncategorized',
          isPaid: false
        });
      }
      
      for (const bill of bills) {
        await prisma.bill.create({
          data: {
            ...bill,
            businessProfileId: profile.id,
            userId: user.id
          }
        });
      }
      console.log(`   ✅ Bills: ${bills.length} created`);
      
      // 5. POPULATE CUSTOMERS (Business only)
      if (profile.type === 'BUSINESS') {
        console.log('\n   👥 Creating Customers...');
        const incomeTransactions = transactions.filter(t => t.type === 'INCOME' && t.amount > 0);
        const customers = [];
        const processedCustomers = new Set();
        
        for (const tx of incomeTransactions.slice(0, 15)) {
          const customerName = tx.description?.split(' ').slice(0, 2).join(' ') || `Customer ${customers.length + 1}`;
          if (processedCustomers.has(customerName)) continue;
          processedCustomers.add(customerName);
          
          customers.push({
            name: customerName,
            email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            phone: '+1234567890',
            isActive: true
          });
        }
        
        for (const customer of customers) {
          await prisma.customer.create({
            data: {
              ...customer,
              businessProfileId: profile.id,
              userId: user.id
            }
          });
        }
        console.log(`   ✅ Customers: ${customers.length} created`);
        
        // 6. POPULATE INVOICES (Business only) - SKIP FOR NOW due to complex schema
        console.log('\n   🧾 Skipping Invoices (complex schema)...');
      }
      
      // 7. POPULATE VENDORS
      console.log('\n   🏢 Creating Vendors...');
      const vendorTransactions = transactions.filter(t => t.type === 'EXPENSE' && t.amount < 0);
      const vendors = [];
      const processedVendors = new Set();
      
      for (const tx of vendorTransactions.slice(0, 15)) {
        const vendorName = tx.description?.split(' ').slice(0, 2).join(' ') || `Vendor ${vendors.length + 1}`;
        if (processedVendors.has(vendorName)) continue;
        processedVendors.add(vendorName);
        
        vendors.push({
          name: vendorName,
          email: `${vendorName.toLowerCase().replace(/\s+/g, '.')}@vendor.com`,
          phone: '+1234567890',
          isActive: true
        });
      }
      
      for (const vendor of vendors) {
        await prisma.vendor.create({
          data: {
            ...vendor,
            businessProfileId: profile.id,
            userId: user.id
          }
        });
      }
      console.log(`   ✅ Vendors: ${vendors.length} created`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ COMPREHENSIVE POPULATION COMPLETE!\n');
    
    // Final count
    console.log('📊 FINAL COUNTS:');
    for (const profile of user.businessProfiles) {
      console.log(`\n   ${profile.name}:`);
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
        categories: await prisma.category.count({ where: { businessProfileId: profile.id } })
      };
      
      Object.entries(counts).forEach(([key, value]) => {
        console.log(`      ${key}: ${value}`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateAllFeatures().catch(console.error);
