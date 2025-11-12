
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateTreasuryFeatures() {
  try {
    console.log('🏦 Starting Treasury & Cash Feature Population...\n');

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log(`User: ${user.email}`);
    console.log(`Business Profiles: ${user.businessProfiles.length}\n`);

    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { businessProfile: true },
      orderBy: { date: 'asc' }
    });

    console.log(`📊 Found ${transactions.length} transactions\n`);

    // Clear existing treasury data
    console.log('🗑️  Clearing existing Treasury data...');
    await prisma.cashFlow.deleteMany({ where: { userId: user.id } });
    await prisma.cashPosition.deleteMany({ where: { userId: user.id } });
    await prisma.cashForecast.deleteMany({ where: { userId: user.id } });
    console.log('✅ Cleared existing data\n');

    // 1. CREATE CASH POSITIONS
    console.log('💰 Creating Cash Positions...');
    const cashPositions = [];

    // Business Operating Account
    const businessTransactions = transactions.filter(t => t.businessProfile.type === 'BUSINESS');
    const businessBalance = businessTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const businessAccount = await prisma.cashPosition.create({
      data: {
        userId: user.id,
        accountName: 'Business Operating Account',
        accountType: 'OPERATING',
        bankName: 'PNC Bank',
        currentBalance: Math.abs(businessBalance),
        availableBalance: Math.abs(businessBalance) * 0.95,
        currency: 'USD',
        interestRate: 0.25,
        monthlyFees: 15,
        minimumBalance: 5000,
        targetBalance: 50000,
        fdic: true,
        riskRating: 'LOW',
        isActive: true,
        notes: 'Primary operating account for The House of Sports'
      }
    });
    cashPositions.push(businessAccount);
    console.log(`  ✓ Created: ${businessAccount.accountName} - $${businessAccount.currentBalance.toLocaleString()}`);

    // Personal Checking Account
    const personalTransactions = transactions.filter(t => t.businessProfile.type === 'PERSONAL');
    const personalBalance = personalTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const personalAccount = await prisma.cashPosition.create({
      data: {
        userId: user.id,
        accountName: 'Personal Checking Account',
        accountType: 'CHECKING',
        bankName: 'PNC Bank',
        currentBalance: Math.abs(personalBalance),
        availableBalance: Math.abs(personalBalance) * 0.98,
        currency: 'USD',
        interestRate: 0.01,
        monthlyFees: 0,
        minimumBalance: 500,
        targetBalance: 10000,
        fdic: true,
        riskRating: 'LOW',
        isActive: true,
        notes: 'Primary personal checking account'
      }
    });
    cashPositions.push(personalAccount);
    console.log(`  ✓ Created: ${personalAccount.accountName} - $${personalAccount.currentBalance.toLocaleString()}`);

    // Savings Account (30% of total balance)
    const totalBalance = Math.abs(businessBalance) + Math.abs(personalBalance);
    const savingsBalance = totalBalance * 0.3;
    
    const savingsAccount = await prisma.cashPosition.create({
      data: {
        userId: user.id,
        accountName: 'High-Yield Savings',
        accountType: 'SAVINGS',
        bankName: 'PNC Bank',
        currentBalance: savingsBalance,
        availableBalance: savingsBalance,
        currency: 'USD',
        interestRate: 4.5,
        monthlyFees: 0,
        minimumBalance: 1000,
        targetBalance: 100000,
        fdic: true,
        riskRating: 'LOW',
        isActive: true,
        notes: 'Emergency fund and reserves'
      }
    });
    cashPositions.push(savingsAccount);
    console.log(`  ✓ Created: ${savingsAccount.accountName} - $${savingsAccount.currentBalance.toLocaleString()}`);

    // Money Market Account
    const moneyMarketBalance = totalBalance * 0.15;
    
    const moneyMarketAccount = await prisma.cashPosition.create({
      data: {
        userId: user.id,
        accountName: 'Money Market Account',
        accountType: 'MONEY_MARKET',
        bankName: 'PNC Bank',
        currentBalance: moneyMarketBalance,
        availableBalance: moneyMarketBalance * 0.95,
        currency: 'USD',
        interestRate: 3.75,
        monthlyFees: 10,
        minimumBalance: 5000,
        targetBalance: 50000,
        fdic: true,
        riskRating: 'LOW',
        isActive: true,
        notes: 'Short-term investment vehicle with liquidity'
      }
    });
    cashPositions.push(moneyMarketAccount);
    console.log(`  ✓ Created: ${moneyMarketAccount.accountName} - $${moneyMarketAccount.currentBalance.toLocaleString()}\n`);

    // 2. CREATE CASH FLOWS
    console.log('💸 Creating Cash Flow Records...');
    let cashFlowCount = 0;

    // Categorize transactions into cash flow categories
    for (const transaction of transactions) {
      let cashFlowCategory = 'OPERATIONS';
      
      // Determine category based on transaction description
      const desc = transaction.description.toLowerCase();
      if (desc.includes('loan') || desc.includes('financing')) {
        cashFlowCategory = 'FINANCING';
      } else if (desc.includes('investment') || desc.includes('asset')) {
        cashFlowCategory = 'INVESTING';
      } else if (desc.includes('tax')) {
        cashFlowCategory = 'TAX';
      } else if (desc.includes('payroll') || desc.includes('salary')) {
        cashFlowCategory = 'PAYROLL';
      } else if (transaction.category === 'Interest Income') {
        cashFlowCategory = 'INTEREST';
      }

      // Determine which cash position this belongs to
      let cashPositionId = null;
      if (transaction.businessProfile.type === 'BUSINESS') {
        cashPositionId = businessAccount.id;
      } else {
        cashPositionId = personalAccount.id;
      }

      await prisma.cashFlow.create({
        data: {
          userId: user.id,
          cashPositionId,
          amount: Math.abs(transaction.amount),
          type: transaction.type === 'INCOME' ? 'INFLOW' : 'OUTFLOW',
          category: cashFlowCategory,
          description: transaction.description,
          date: transaction.date,
          isRecurring: false,
          status: 'ACTUAL',
          currency: 'USD'
        }
      });
      cashFlowCount++;
    }

    console.log(`  ✓ Created ${cashFlowCount} cash flow records\n`);

    // 3. CREATE CASH FORECASTS
    console.log('📈 Generating Cash Forecasts...');
    
    // Calculate monthly averages from ALL transaction data (12 months)
    const earliestDate = new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())));
    const latestDate = new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())));
    
    const monthsDiff = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    console.log(`  📅 Using full data from ${earliestDate.toISOString().split('T')[0]} to ${latestDate.toISOString().split('T')[0]}`);
    console.log(`  📊 Analyzing ${transactions.length} transactions over ${monthsDiff} months\n`);

    const totalInflows = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflows = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const avgMonthlyInflows = totalInflows / monthsDiff;
    const avgMonthlyOutflows = totalOutflows / monthsDiff;

    console.log(`  📊 Avg Monthly Inflows: $${avgMonthlyInflows.toLocaleString()}`);
    console.log(`  📊 Avg Monthly Outflows: $${avgMonthlyOutflows.toLocaleString()}`);

    // Generate 90-day forecast
    const currentCash = totalBalance;
    let runningBalance = currentCash;
    let forecastCount = 0;

    for (let day = 1; day <= 90; day++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + day);

      // Daily projections (with some randomness for realism)
      const dailyInflows = (avgMonthlyInflows / 30) * (0.85 + Math.random() * 0.3);
      const dailyOutflows = (avgMonthlyOutflows / 30) * (0.85 + Math.random() * 0.3);

      const openingBalance = runningBalance;
      const closingBalance = openingBalance + dailyInflows - dailyOutflows;
      runningBalance = closingBalance;

      // Confidence decreases over time
      const confidence = Math.max(0.3, 0.95 - (day / 90) * 0.5);

      await prisma.cashForecast.create({
        data: {
          userId: user.id,
          forecastDate,
          horizon: day,
          openingBalance,
          projectedInflows: dailyInflows,
          projectedOutflows: dailyOutflows,
          closingBalance,
          minimumBalance: currentCash * 0.5,
          maximumBalance: currentCash * 1.5,
          confidence,
          modelVersion: 'v1.0-historical-avg'
        }
      });
      forecastCount++;
    }

    console.log(`  ✓ Generated ${forecastCount} daily forecasts (90-day horizon)\n`);

    // 4. CREATE MULTI-CURRENCY SETUP
    console.log('🌍 Setting up Multi-Currency...');
    
    // Check if USD currency exists
    const usdCurrency = await prisma.currency.findUnique({
      where: { code: 'USD' }
    });

    if (!usdCurrency) {
      await prisma.currency.create({
        data: {
          code: 'USD',
          name: 'United States Dollar',
          symbol: '$',
          decimals: 2,
          isActive: true
        }
      });
      console.log('  ✓ Created USD as base currency');
    } else {
      console.log('  ✓ USD currency already exists');
    }

    // Add common exchange rates
    const currencies = [
      { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
      { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79 },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.50 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.36 }
    ];

    for (const curr of currencies) {
      const existing = await prisma.currency.findUnique({ where: { code: curr.code } });
      if (!existing) {
        await prisma.currency.create({
          data: {
            code: curr.code,
            name: curr.name,
            symbol: curr.symbol,
            decimals: 2,
            isActive: false
          }
        });

        await prisma.exchangeRate.create({
          data: {
            fromCurrency: 'USD',
            toCurrency: curr.code,
            rate: curr.rate,
            date: new Date()
          }
        });
      }
    }
    console.log(`  ✓ Added ${currencies.length} additional currencies with exchange rates\n`);

    // SUMMARY
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TREASURY & CASH POPULATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📊 SUMMARY:');
    console.log(`  • Cash Positions: ${cashPositions.length} accounts`);
    console.log(`  • Total Cash: $${totalBalance.toLocaleString()}`);
    console.log(`  • Cash Flows: ${cashFlowCount} records`);
    console.log(`  • Cash Forecasts: ${forecastCount} days`);
    console.log(`  • Currencies: 5 (USD + 4 additional)`);
    console.log('');
    
    console.log('💰 CASH POSITION BREAKDOWN:');
    for (const pos of cashPositions) {
      console.log(`  • ${pos.accountName}: $${pos.currentBalance.toLocaleString()}`);
    }
    console.log('');

    console.log('📈 CASH FLOW METRICS:');
    console.log(`  • Avg Monthly Inflows: $${avgMonthlyInflows.toLocaleString()}`);
    console.log(`  • Avg Monthly Outflows: $${avgMonthlyOutflows.toLocaleString()}`);
    console.log(`  • Net Monthly Cash Flow: $${(avgMonthlyInflows - avgMonthlyOutflows).toLocaleString()}`);
    console.log('');

    console.log('🔮 FORECAST INSIGHTS:');
    console.log(`  • 90-Day Projection: $${runningBalance.toLocaleString()}`);
    console.log(`  • Expected Change: $${(runningBalance - currentCash).toLocaleString()}`);
    console.log(`  • Confidence: High to Medium (95% → 45%)`);
    console.log('');

    console.log('🎯 NEXT STEPS:');
    console.log('  1. Visit /dashboard/treasury/positions to view cash accounts');
    console.log('  2. Visit /dashboard/treasury/cash-flow to see cash flow analysis');
    console.log('  3. Visit /dashboard/treasury/forecasting for 90-day projections');
    console.log('  4. Visit /dashboard/treasury/currency for multi-currency management');
    console.log('');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

populateTreasuryFeatures();
