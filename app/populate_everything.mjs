
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function populateEverything() {
  console.log('\n🚀 POPULATING ALL FEATURES - AGGRESSIVE MODE\n');
  console.log('='.repeat(70));
  
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
    
    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
    
    console.log('\n👤 User:', user.email);
    console.log(`📊 Personal Profile: ${personalProfile?.name}`);
    console.log(`📊 Business Profile: ${businessProfile?.name}\n`);
    
    // POPULATE DEBTS (AGGRESSIVE)
    console.log('💳 Creating Debts...');
    const debtData = [
      { name: 'Credit Card Payment', type: 'CREDIT_CARD', balance: 5000, interestRate: 18.99, minimumPayment: 150, dueDate: 15 },
      { name: 'Business Loan', type: 'PERSONAL_LOAN', balance: 25000, interestRate: 7.5, minimumPayment: 750, dueDate: 1 },
      { name: 'Equipment Financing', type: 'PERSONAL_LOAN', balance: 15000, interestRate: 5.9, minimumPayment: 450, dueDate: 10 },
      { name: 'Line of Credit', type: 'OTHER', balance: 10000, interestRate: 9.5, minimumPayment: 200, dueDate: 20 }
    ];
    
    let debtsCreated = 0;
    for (const debt of debtData) {
      const profileId = debt.type === 'CREDIT_CARD' ? personalProfile?.id : businessProfile?.id;
      if (!profileId) continue;
      
      const existing = await prisma.debt.findFirst({
        where: { name: debt.name, businessProfileId: profileId }
      });
      
      if (!existing) {
        await prisma.debt.create({
          data: { ...debt, businessProfileId: profileId, userId: user.id, isActive: true }
        });
        debtsCreated++;
      }
    }
    console.log(`✅ Debts created: ${debtsCreated}`);
    
    // POPULATE BILLS (AGGRESSIVE)
    console.log('\n📄 Creating Bills...');
    const billData = [
      { description: 'Rent Payment', amount: 2500, category: 'Rent', dueDate: new Date(2025, 11, 1) },
      { description: 'Utilities - Electric', amount: 150, category: 'Utilities', dueDate: new Date(2025, 11, 15) },
      { description: 'Internet Service', amount: 89.99, category: 'Utilities', dueDate: new Date(2025, 11, 10) },
      { description: 'Insurance Premium', amount: 450, category: 'Insurance', dueDate: new Date(2025, 11, 5) },
      { description: 'Equipment Lease', amount: 800, category: 'Equipment', dueDate: new Date(2025, 11, 12) },
      { description: 'Software Subscriptions', amount: 299, category: 'Software', dueDate: new Date(2025, 11, 1) },
      { description: 'Phone Service', amount: 120, category: 'Utilities', dueDate: new Date(2025, 11, 20) },
      { description: 'Payroll Processing Fee', amount: 75, category: 'Services', dueDate: new Date(2025, 11, 1) }
    ];
    
    let billsCreated = 0;
    for (const bill of billData) {
      const profileId = bill.category === 'Rent' || bill.category === 'Insurance' ? personalProfile?.id : businessProfile?.id;
      if (!profileId) continue;
      
      await prisma.bill.create({
        data: { ...bill, businessProfileId: profileId, userId: user.id, status: 'PENDING' }
      });
      billsCreated++;
    }
    console.log(`✅ Bills created: ${billsCreated}`);
    
    // POPULATE VENDORS (AGGRESSIVE)
    console.log('\n🏢 Creating Vendors...');
    const vendorData = [
      { name: 'Office Supply Co', email: 'sales@officesupply.com', phone: '+1-555-0101' },
      { name: 'Tech Solutions LLC', email: 'billing@techsolutions.com', phone: '+1-555-0102' },
      { name: 'Marketing Agency', email: 'accounts@marketing.com', phone: '+1-555-0103' },
      { name: 'Landlord Properties', email: 'rent@landlord.com', phone: '+1-555-0104' },
      { name: 'Equipment Rentals Inc', email: 'info@equipmentrentals.com', phone: '+1-555-0105' },
      { name: 'Professional Services', email: 'billing@professional.com', phone: '+1-555-0106' },
      { name: 'Utilities Provider', email: 'customerservice@utilities.com', phone: '+1-555-0107' },
      { name: 'Insurance Broker', email: 'policies@insurance.com', phone: '+1-555-0108' },
      { name: 'Accounting Firm', email: 'billing@accounting.com', phone: '+1-555-0109' },
      { name: 'Legal Services', email: 'accounts@legal.com', phone: '+1-555-0110' }
    ];
    
    let vendorsCreated = 0;
    for (const vendor of vendorData) {
      const profileId = Math.random() > 0.3 ? businessProfile?.id : personalProfile?.id;
      if (!profileId) continue;
      
      const existing = await prisma.vendor.findFirst({
        where: { name: vendor.name, businessProfileId: profileId }
      });
      
      if (!existing) {
        await prisma.vendor.create({
          data: { ...vendor, businessProfileId: profileId, userId: user.id, isActive: true }
        });
        vendorsCreated++;
      }
    }
    console.log(`✅ Vendors created: ${vendorsCreated}`);
    
    // POPULATE PERSONAL FEATURES
    if (personalProfile) {
      console.log(`\n🏠 Populating Personal Features for ${personalProfile.name}...`);
      
      // Healthcare
      console.log('   💊 Creating Healthcare expenses...');
      const healthcareExpenses = [
        { description: 'Health Insurance Premium', amount: -450, date: new Date(2025, 0, 1), category: 'Healthcare' },
        { description: 'Dental Checkup', amount: -150, date: new Date(2025, 1, 15), category: 'Healthcare' },
        { description: 'Prescription Medication', amount: -75, date: new Date(2025, 2, 10), category: 'Healthcare' }
      ];
      
      for (const expense of healthcareExpenses) {
        await prisma.transaction.create({
          data: {
            ...expense,
            type: 'EXPENSE',
            businessProfileId: personalProfile.id,
            userId: user.id
          }
        });
      }
      console.log(`   ✅ Healthcare expenses: ${healthcareExpenses.length}`);
      
      // Vehicles
      console.log('   🚗 Creating Vehicles...');
      const vehicles = [
        { make: 'Toyota', model: 'Camry', year: 2020, licensePlate: 'ABC-1234', vin: '1HGBH41JXMN109186', purchasePrice: 25000, currentValue: 20000 },
        { make: 'Honda', model: 'CR-V', year: 2021, licensePlate: 'XYZ-5678', vin: '5FNRL6H79NB038561', purchasePrice: 30000, currentValue: 27000 }
      ];
      
      let vehiclesCreated = 0;
      for (const vehicle of vehicles) {
        const existing = await prisma.vehicle.findFirst({
          where: { licensePlate: vehicle.licensePlate, businessProfileId: personalProfile.id }
        });
        
        if (!existing) {
          await prisma.vehicle.create({
            data: { ...vehicle, businessProfileId: personalProfile.id, userId: user.id }
          });
          vehiclesCreated++;
        }
      }
      console.log(`   ✅ Vehicles created: ${vehiclesCreated}`);
      
      // Insurance Policies
      console.log('   🛡️  Creating Insurance policies...');
      const insurancePolicies = [
        { 
          policyName: 'Auto Insurance Policy',
          type: 'AUTO',
          insuranceProvider: 'State Farm',
          policyNumber: 'POL-123456',
          premium: 150,
          coverageAmount: 100000,
          effectiveDate: new Date(2025, 0, 1),
          expirationDate: new Date(2025, 11, 31)
        },
        {
          policyName: 'Homeowners Insurance',
          type: 'PROPERTY',
          insuranceProvider: 'Allstate',
          policyNumber: 'POL-789012',
          premium: 120,
          coverageAmount: 250000,
          effectiveDate: new Date(2025, 0, 1),
          expirationDate: new Date(2025, 11, 31)
        },
        {
          policyName: 'Health Insurance Policy',
          type: 'HEALTH',
          insuranceProvider: 'Blue Cross',
          policyNumber: 'POL-345678',
          premium: 450,
          coverageAmount: 1000000,
          effectiveDate: new Date(2025, 0, 1),
          expirationDate: new Date(2025, 11, 31)
        }
      ];
      
      let insuranceCreated = 0;
      for (const policy of insurancePolicies) {
        const existing = await prisma.insurancePolicy.findFirst({
          where: { policyNumber: policy.policyNumber, userId: user.id }
        });
        
        if (!existing) {
          await prisma.insurancePolicy.create({
            data: { ...policy, userId: user.id, isActive: true }
          });
          insuranceCreated++;
        }
      }
      console.log(`   ✅ Insurance policies: ${insuranceCreated}`);
    }
    
    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 FINAL DATABASE STATE:\n');
    
    for (const profile of user.businessProfiles) {
      console.log(`${profile.name} (${profile.type}):`);
      const counts = {
        transactions: await prisma.transaction.count({ where: { businessProfileId: profile.id } }),
        budgets: await prisma.budget.count({ where: { businessProfileId: profile.id } }),
        goals: await prisma.goal.count({ where: { businessProfileId: profile.id } }),
        debts: await prisma.debt.count({ where: { businessProfileId: profile.id } }),
        bills: await prisma.bill.count({ where: { businessProfileId: profile.id } }),
        vendors: await prisma.vendor.count({ where: { businessProfileId: profile.id } }),
        customers: await prisma.customer.count({ where: { businessProfileId: profile.id } }),
        recurringCharges: await prisma.recurringCharge.count({ where: { businessProfileId: profile.id } }),
        categories: await prisma.category.count({ where: { businessProfileId: profile.id } }),
        vehicles: await prisma.vehicle.count({ where: { businessProfileId: profile.id } }),
        insurancePolicies: profile.type === 'PERSONAL' ? await prisma.insurancePolicy.count({ where: { userId: user.id } }) : 0
      };
      
      Object.entries(counts).forEach(([key, value]) => {
        const icon = value > 0 ? '✅' : '❌';
        console.log(`  ${icon} ${key}: ${value}`);
      });
      console.log('');
    }
    
    console.log('✅ POPULATION COMPLETE!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

populateEverything().catch(console.error);
