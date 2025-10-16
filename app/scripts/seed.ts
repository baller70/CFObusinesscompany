
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('johndoe123', 12);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      companyName: 'Acme Corporation',
      jobTitle: 'CEO',
      businessType: 'SMALL_BUSINESS',
    }
  });

  console.log('👤 Created test user:', testUser.email);

  // Create default business profile for test user
  const defaultProfile = await prisma.businessProfile.upsert({
    where: {
      userId_name: {
        userId: testUser.id,
        name: 'Personal/Household'
      }
    },
    update: {},
    create: {
      userId: testUser.id,
      name: 'Personal/Household',
      type: 'PERSONAL',
      description: 'Personal and household expenses',
      icon: 'Home',
      color: '#3B82F6',
      isDefault: true,
      isActive: true
    }
  });

  // Set as current profile
  await prisma.user.update({
    where: { id: testUser.id },
    data: { currentBusinessProfileId: defaultProfile.id }
  });

  console.log('🏢 Created default business profile');

  // Create default categories for test user
  const defaultCategories = [
    { name: "Food & Dining", color: "#FF6B6B", icon: "utensils", type: "EXPENSE" as const },
    { name: "Transportation", color: "#4ECDC4", icon: "car", type: "EXPENSE" as const },
    { name: "Shopping", color: "#45B7D1", icon: "shopping-bag", type: "EXPENSE" as const },
    { name: "Entertainment", color: "#96CEB4", icon: "music", type: "EXPENSE" as const },
    { name: "Bills & Utilities", color: "#6B7280", icon: "zap", type: "EXPENSE" as const },
    { name: "Healthcare", color: "#FF9FF3", icon: "heart", type: "EXPENSE" as const },
    { name: "Education", color: "#54A0FF", icon: "book", type: "EXPENSE" as const },
    { name: "Personal Care", color: "#5F27CD", icon: "user", type: "EXPENSE" as const },
    { name: "Gifts & Donations", color: "#00D2D3", icon: "gift", type: "EXPENSE" as const },
    { name: "Other Expenses", color: "#FF9F43", icon: "more-horizontal", type: "EXPENSE" as const },
    { name: "Salary", color: "#2ED573", icon: "dollar-sign", type: "INCOME" as const },
    { name: "Freelance", color: "#3742FA", icon: "briefcase", type: "INCOME" as const },
    { name: "Other Income", color: "#2F3542", icon: "trending-up", type: "INCOME" as const },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        userId_businessProfileId_name: {
          userId: testUser.id,
          businessProfileId: defaultProfile.id,
          name: category.name
        }
      },
      update: {},
      create: {
        ...category,
        userId: testUser.id,
        businessProfileId: defaultProfile.id,
        isDefault: true
      }
    });
  }

  console.log('📊 Created default categories');

  // NOTE: No sample data is created. All financial data should come from:
  // 1. User-uploaded bank statements (PDF/CSV)
  // 2. Manual transaction entries
  // 3. AI-generated budgets based on actual transactions
  
  console.log('✅ Seed completed - No sample financial data created');
  console.log('💡 Upload bank statements to populate transactions and budgets');

  // Removed: Sample transactions, debts, and financial metrics
  // These will be generated dynamically from uploaded data
  
  /*
  // Create sample debt
  await prisma.debt.create({
    data: {
      userId: testUser.id,
      name: 'Credit Card Debt',
      balance: 2500.00,
      interestRate: 18.5,
      minimumPayment: 75.00,
      dueDate: 15,
      type: 'CREDIT_CARD'
    }
  });

  console.log('💳 Created sample debt');

  // Create financial metrics
  const existingMetrics = await prisma.financialMetrics.findFirst({
    where: { userId: testUser.id, businessProfileId: defaultProfile.id }
  });

  if (!existingMetrics) {
    await prisma.financialMetrics.create({
      data: {
        userId: testUser.id,
        businessProfileId: defaultProfile.id,
        monthlyIncome: 3500,
        monthlyExpenses: 1343.49,
        monthlyBurnRate: -2156.51,
        totalDebt: 2500,
        totalAssets: 5000,
        netWorth: 2500,
        emergencyFundGoal: 3000,
        debtToIncomeRatio: 0.595
      }
    });
  }

  console.log('📈 Created financial metrics');
  */

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 Demo Account:');
  console.log('   Email: john@doe.com');
  console.log('   Password: johndoe123');
  console.log('');
  console.log('📁 To populate with data:');
  console.log('   1. Login with demo account');
  console.log('   2. Go to Financial Statements page');
  console.log('   3. Upload your bank statement PDFs');
  console.log('   4. Transactions and budgets will be auto-generated');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
