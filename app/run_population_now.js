require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateAllFeatures(userId, businessProfileId) {
  console.log('[Auto-Populator] 🚀 Starting comprehensive feature population...');
  
  try {
    // Get all transactions for this profile
    const transactions = await prisma.transaction.findMany({
      where: { businessProfileId },
      include: { categoryRelation: true }
    });
    
    console.log(`[Auto-Populator] Found ${transactions.length} transactions`);
    
    if (transactions.length === 0) {
      console.log('[Auto-Populator] ⚠️  No transactions to process');
      return;
    }
    
    // 1. BUDGETS - from spending patterns
    console.log('[Auto-Populator] 💰 Populating Budgets...');
    const categorySpending = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const cat = t.categoryRelation?.name || t.category || 'Other';
      categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(t.amount);
    });
    
    for (const [category, total] of Object.entries(categorySpending)) {
      const suggestedBudget = Math.ceil(total * 1.1); // 10% buffer
      if (suggestedBudget > 0) {
        await prisma.budget.upsert({
          where: {
            userId_businessProfileId_category_month_year: {
              userId,
              businessProfileId,
              category,
              month: new Date().getMonth() + 1,
              year: new Date().getFullYear()
            }
          },
          create: {
            userId,
            businessProfileId,
            name: `${category} Budget`,
            category,
            amount: suggestedBudget,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            type: 'MONTHLY'
          },
          update: {
            amount: suggestedBudget
          }
        });
      }
    }
    console.log(`[Auto-Populator] ✅ Created/updated ${Object.keys(categorySpending).length} budgets`);
    
    // 2. GOALS - from income
    console.log('[Auto-Populator] 🎯 Populating Goals...');
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    if (totalIncome > 0) {
      const savingsGoal = Math.ceil(totalIncome * 0.2); // 20% savings target
      const emergencyGoal = Math.ceil(totalIncome * 0.5); // 50% for emergency
      
      await prisma.goal.upsert({
        where: {
          userId_businessProfileId_name: {
            userId,
            businessProfileId,
            name: 'Monthly Savings Target'
          }
        },
        create: {
          userId,
          businessProfileId,
          name: 'Monthly Savings Target',
          targetAmount: savingsGoal,
          currentAmount: 0,
          deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          category: 'SAVINGS'
        },
        update: {
          targetAmount: savingsGoal
        }
      });
      
      await prisma.goal.upsert({
        where: {
          userId_businessProfileId_name: {
            userId,
            businessProfileId,
            name: 'Emergency Fund'
          }
        },
        create: {
          userId,
          businessProfileId,
          name: 'Emergency Fund',
          targetAmount: emergencyGoal,
          currentAmount: 0,
          deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          category: 'EMERGENCY_FUND'
        },
        update: {
          targetAmount: emergencyGoal
        }
      });
      console.log(`[Auto-Populator] ✅ Created 2 goals`);
    }
    
    // 3. DEBTS - from recurring negative transactions
    console.log('[Auto-Populator] 💳 Populating Debts...');
    const recurringDebts = {};
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const desc = t.description?.toLowerCase() || '';
      if (desc.includes('loan') || desc.includes('mortgage') || desc.includes('payment') || desc.includes('credit')) {
        const key = t.description?.substring(0, 50) || 'Unknown';
        recurringDebts[key] = (recurringDebts[key] || []);
        recurringDebts[key].push(t);
      }
    });
    
    let debtCount = 0;
    for (const [name, txs] of Object.entries(recurringDebts)) {
      if (txs.length >= 1) {
        const avgPayment = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txs.length;
        const estimatedBalance = avgPayment * 24; // Estimate 2 years remaining
        
        await prisma.debt.upsert({
          where: {
            userId_businessProfileId_name: {
              userId,
              businessProfileId,
              name
            }
          },
          create: {
            userId,
            businessProfileId,
            name,
            balance: estimatedBalance,
            interestRate: 5.0,
            minimumPayment: avgPayment,
            dueDay: 15,
            type: 'OTHER'
          },
          update: {
            minimumPayment: avgPayment,
            balance: estimatedBalance
          }
        });
        debtCount++;
      }
    }
    console.log(`[Auto-Populator] ✅ Created/updated ${debtCount} debts`);
    
    // 4. RECURRING CHARGES - from regular patterns
    console.log('[Auto-Populator] 🔄 Populating Recurring Charges...');
    const merchantCounts = {};
    transactions.forEach(t => {
      const merchant = (t.description || '').split(/[0-9]/)[0].trim().substring(0, 30);
      if (merchant && merchant.length > 3) {
        merchantCounts[merchant] = (merchantCounts[merchant] || []);
        merchantCounts[merchant].push(t);
      }
    });
    
    let recurringCount = 0;
    for (const [merchant, txs] of Object.entries(merchantCounts)) {
      if (txs.length >= 2) {
        const avgAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txs.length;
        const variance = Math.max(...txs.map(t => Math.abs(t.amount))) - Math.min(...txs.map(t => Math.abs(t.amount)));
        
        if (variance < avgAmount * 0.5) { // Similar amounts = recurring
          await prisma.recurringCharge.upsert({
            where: {
              userId_businessProfileId_name: {
                userId,
                businessProfileId,
                name: merchant
              }
            },
            create: {
              userId,
              businessProfileId,
              name: merchant,
              amount: avgAmount,
              frequency: 'MONTHLY',
              category: txs[0].categoryRelation?.name || txs[0].category || 'Other',
              nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              isActive: true
            },
            update: {
              amount: avgAmount
            }
          });
          recurringCount++;
        }
      }
    }
    console.log(`[Auto-Populator] ✅ Created/updated ${recurringCount} recurring charges`);
    
    // 5. CUSTOMERS - from income sources
    console.log('[Auto-Populator] 👥 Populating Customers...');
    const incomeSources = new Set();
    transactions.filter(t => t.type === 'INCOME').forEach(t => {
      const source = (t.description || '').split(/[0-9]/)[0].trim().substring(0, 50);
      if (source && source.length > 3) incomeSources.add(source);
    });
    
    let customerCount = 0;
    for (const source of Array.from(incomeSources).slice(0, 20)) {
      try {
        await prisma.customer.upsert({
          where: {
            userId_businessProfileId_name: {
              userId,
              businessProfileId,
              name: source
            }
          },
          create: {
            userId,
            businessProfileId,
            name: source,
            email: `${source.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}@example.com`,
            status: 'ACTIVE'
          },
          update: {}
        });
        customerCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`[Auto-Populator] ✅ Created/updated ${customerCount} customers`);
    
    // 6. VENDORS - from expense payees
    console.log('[Auto-Populator] 🏢 Populating Vendors...');
    const vendors = new Set();
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const vendor = (t.description || '').split(/[0-9]/)[0].trim().substring(0, 50);
      if (vendor && vendor.length > 3) vendors.add(vendor);
    });
    
    let vendorCount = 0;
    for (const vendor of Array.from(vendors).slice(0, 30)) {
      try {
        await prisma.vendor.upsert({
          where: {
            userId_businessProfileId_name: {
              userId,
              businessProfileId,
              name: vendor
            }
          },
          create: {
            userId,
            businessProfileId,
            name: vendor,
            email: `${vendor.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}@example.com`,
            status: 'ACTIVE'
          },
          update: {}
        });
        vendorCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`[Auto-Populator] ✅ Created/updated ${vendorCount} vendors`);
    
    // 7. BILLS - from large expenses
    console.log('[Auto-Populator] 📄 Populating Bills...');
    const largeExpenses = transactions
      .filter(t => t.type === 'EXPENSE' && Math.abs(t.amount) > 100)
      .slice(0, 15);
    
    let billCount = 0;
    for (const tx of largeExpenses) {
      try {
        const vendorName = tx.description?.substring(0, 50) || 'Unknown Vendor';
        const existingBill = await prisma.bill.findFirst({
          where: {
            businessProfileId,
            vendorName,
            amount: Math.abs(tx.amount),
            dueDate: new Date(tx.date)
          }
        });
        
        if (!existingBill) {
          await prisma.bill.create({
            data: {
              userId,
              businessProfileId,
              vendorName,
              amount: Math.abs(tx.amount),
              dueDate: new Date(tx.date),
              status: 'PAID',
              category: tx.categoryRelation?.name || tx.category || 'Other',
              description: `Auto-generated from transaction: ${tx.description}`
            }
          });
          billCount++;
        }
      } catch (e) {
        console.error(`[Auto-Populator] Error creating bill: ${e.message}`);
      }
    }
    console.log(`[Auto-Populator] ✅ Created ${billCount} bills`);
    
    // 8. INVOICES - from large income
    console.log('[Auto-Populator] 📑 Populating Invoices...');
    const largeIncome = transactions
      .filter(t => t.type === 'INCOME' && t.amount > 100)
      .slice(0, 15);
    
    let invoiceCount = 0;
    for (const tx of largeIncome) {
      try {
        const customerName = tx.description?.substring(0, 50) || 'Unknown Customer';
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            businessProfileId,
            customerName,
            amount: tx.amount,
            issueDate: new Date(tx.date)
          }
        });
        
        if (!existingInvoice) {
          await prisma.invoice.create({
            data: {
              userId,
              businessProfileId,
              invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              customerName,
              amount: tx.amount,
              issueDate: new Date(tx.date),
              dueDate: new Date(tx.date),
              status: 'PAID',
              items: [
                {
                  description: `Payment received: ${tx.description}`,
                  quantity: 1,
                  unitPrice: tx.amount,
                  total: tx.amount
                }
              ]
            }
          });
          invoiceCount++;
        }
      } catch (e) {
        console.error(`[Auto-Populator] Error creating invoice: ${e.message}`);
      }
    }
    console.log(`[Auto-Populator] ✅ Created ${invoiceCount} invoices`);
    
    console.log('[Auto-Populator] ✅ ALL FEATURES POPULATED SUCCESSFULLY!');
    return { success: true };
    
  } catch (error) {
    console.error('[Auto-Populator] ❌ Error:', error);
    throw error;
  }
}

async function main() {
  console.log('\n🚀 COMPREHENSIVE FEATURE POPULATION\n');
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
  console.log(`🏢 Profiles: ${user.businessProfiles.length}\n`);
  
  // Run for each profile
  for (const profile of user.businessProfiles) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 PROCESSING: ${profile.name} (${profile.type})`);
    console.log(`${'='.repeat(60)}\n`);
    
    await populateAllFeatures(user.id, profile.id);
  }
  
  // Show final results
  console.log('\n\n' + '='.repeat(60));
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
