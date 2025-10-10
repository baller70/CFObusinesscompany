
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
          businessProfileId: null,
          name: category.name
        }
      },
      update: {},
      create: {
        ...category,
        userId: testUser.id,
        businessProfileId: null,
        isDefault: true
      }
    });
  }

  console.log('📊 Created default categories');

  // Create sample transactions
  const sampleTransactions = [
    {
      date: new Date('2024-01-15'),
      amount: 3500,
      description: 'Monthly Salary',
      category: 'Salary',
      type: 'INCOME' as const,
      account: 'Checking Account'
    },
    {
      date: new Date('2024-01-16'),
      amount: -1200,
      description: 'Rent Payment',
      category: 'Bills & Utilities',
      type: 'EXPENSE' as const,
      account: 'Checking Account',
      merchant: 'Property Management Co.'
    },
    {
      date: new Date('2024-01-17'),
      amount: -85.50,
      description: 'Grocery Shopping',
      category: 'Food & Dining',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      merchant: 'Whole Foods'
    },
    {
      date: new Date('2024-01-18'),
      amount: -45.00,
      description: 'Gas Station',
      category: 'Transportation',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      merchant: 'Shell'
    },
    {
      date: new Date('2024-01-19'),
      amount: -12.99,
      description: 'Netflix Subscription',
      category: 'Entertainment',
      type: 'EXPENSE' as const,
      account: 'Credit Card',
      merchant: 'Netflix'
    },
  ];

  for (const transaction of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        ...transaction,
        userId: testUser.id
      }
    });
  }

  console.log('💳 Created sample transactions');

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
    where: { userId: testUser.id, businessProfileId: null }
  });

  if (!existingMetrics) {
    await prisma.financialMetrics.create({
      data: {
        userId: testUser.id,
        businessProfileId: null,
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

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
