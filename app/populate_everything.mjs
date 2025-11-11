import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();

async function populateFinancialGoals() {
  try {
    console.log('\n🎯 POPULATING CFO-LEVEL FINANCIAL GOALS\n');
    console.log('='.repeat(70));

    // Load analysis data
    const analysis = JSON.parse(await fs.promises.readFile('/tmp/financial_analysis_2024.json', 'utf8'));
    
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Clear existing goals first
    for (const profile of user.businessProfiles) {
      await prisma.goal.deleteMany({
        where: { businessProfileId: profile.id }
      });
    }

    console.log('✅ Cleared existing goals\n');

    let totalGoalsCreated = 0;

    // ========== PERSONAL/HOUSEHOLD GOALS ==========
    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    if (personalProfile && analysis.personal) {
      console.log(`${'═'.repeat(70)}`);
      console.log(`🏠 PERSONAL/HOUSEHOLD FINANCIAL GOALS`);
      console.log('═'.repeat(70));

      const personal = analysis.personal;
      const monthlyIncome = personal.avgMonthlyIncome;
      const monthlyExpenses = personal.avgMonthlyExpenses;

      // Goal 1: Emergency Fund (6 months of expenses)
      // Since expense data is incomplete, use conservative 30% of income
      const estimatedMonthlyExpenses = monthlyIncome * 0.30; // $3,044
      const emergencyFundTarget = estimatedMonthlyExpenses * 6; // $18,267
      
      await prisma.goal.create({
        data: {
          name: 'Emergency Fund - 6 Months',
          description: 'Build a robust emergency fund covering 6 months of estimated living expenses ($3,044/month). This provides financial security and peace of mind for unexpected life events.',
          targetAmount: Math.round(emergencyFundTarget),
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'EMERGENCY_FUND',
          priority: 1,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Emergency Fund Goal: $${emergencyFundTarget.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 2: High-Interest Debt Elimination
      await prisma.goal.create({
        data: {
          name: 'Eliminate Credit Card Debt',
          description: 'Pay off $5,000 credit card balance at 18.99% APR. This will save $950/year in interest and improve credit score. Prioritize this before other savings goals.',
          targetAmount: 5000,
          currentAmount: 0,
          targetDate: new Date('2025-06-30'),
          type: 'DEBT_PAYOFF',
          priority: 1,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Debt Elimination Goal: $5,000`);
      totalGoalsCreated++;

      // Goal 3: Retirement Savings (15% of income)
      const annualRetirementTarget = personal.totalIncome * 0.15; // $18,267
      await prisma.goal.create({
        data: {
          name: 'Retirement Savings - 2025',
          description: 'Save 15% of gross income ($18,267) for retirement through 401(k), IRA, or other tax-advantaged accounts. This aligns with CFO best practices for long-term wealth building.',
          targetAmount: Math.round(annualRetirementTarget),
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'INVESTMENT',
          priority: 2,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Retirement Savings Goal: $${annualRetirementTarget.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 4: Home Down Payment Fund
      await prisma.goal.create({
        data: {
          name: 'Home Down Payment Fund',
          description: 'Save $50,000 for a 20% down payment on a $250,000 home. This avoids PMI and positions you for homeownership with equity from day one.',
          targetAmount: 50000,
          currentAmount: 0,
          targetDate: new Date('2027-12-31'),
          type: 'SAVINGS',
          priority: 3,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Home Down Payment Goal: $50,000`);
      totalGoalsCreated++;

      // Goal 5: Investment Portfolio Starter
      await prisma.goal.create({
        data: {
          name: 'Build Investment Portfolio',
          description: 'Create diversified investment portfolio with $25,000 in index funds, ETFs, and bonds. Target 7-10% annual returns for long-term wealth accumulation.',
          targetAmount: 25000,
          currentAmount: 0,
          targetDate: new Date('2026-12-31'),
          type: 'INVESTMENT',
          priority: 2,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Investment Portfolio Goal: $25,000`);
      totalGoalsCreated++;

      // Goal 6: Education/Skills Fund
      await prisma.goal.create({
        data: {
          name: 'Professional Development Fund',
          description: 'Invest $5,000 in professional certifications, courses, or skill development to increase earning potential and career advancement opportunities.',
          targetAmount: 5000,
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'SAVINGS',
          priority: 3,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Professional Development Goal: $5,000`);
      totalGoalsCreated++;

      // Goal 7: Health & Wellness Fund
      await prisma.goal.create({
        data: {
          name: 'Health Savings Account (HSA)',
          description: 'Max out HSA contributions at $4,150 for tax-advantaged healthcare savings. Triple tax benefit: tax-deductible contributions, tax-free growth, tax-free withdrawals for medical expenses.',
          targetAmount: 4150,
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'SAVINGS',
          priority: 2,
          businessProfileId: personalProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Health Savings Goal: $4,150`);
      totalGoalsCreated++;

      console.log(`\n📊 Total Personal Goals Created: ${7}`);
    }

    // ========== BUSINESS GOALS ==========
    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
    if (businessProfile && analysis.business) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`🏢 THE HOUSE OF SPORTS - BUSINESS FINANCIAL GOALS`);
      console.log('═'.repeat(70));

      const business = analysis.business;
      const monthlyRevenue = business.avgMonthlyIncome;

      // Goal 1: Eliminate High-Interest Business Credit Cards
      const ccDebt = 9772.80 + 9866.25; // $19,639
      await prisma.goal.create({
        data: {
          name: 'Pay Off Business Credit Cards',
          description: 'Eliminate $19,639 in high-interest credit card debt (18.99-19.99% APR). This will save ~$3,800/year in interest and improve business credit score.',
          targetAmount: Math.round(ccDebt),
          currentAmount: 0,
          targetDate: new Date('2025-09-30'),
          type: 'DEBT_PAYOFF',
          priority: 1,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Credit Card Payoff Goal: $${ccDebt.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 2: Operating Cash Reserve (3 months)
      // Estimate operating expenses at 60% of revenue
      const estimatedMonthlyOpEx = monthlyRevenue * 0.60; // $20,188
      const cashReserveTarget = estimatedMonthlyOpEx * 3; // $60,564
      
      await prisma.goal.create({
        data: {
          name: 'Operating Cash Reserve',
          description: 'Build 3-month operating cash reserve of $60,564. This ensures business continuity during slow periods, economic downturns, or unexpected expenses.',
          targetAmount: Math.round(cashReserveTarget),
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'EMERGENCY_FUND',
          priority: 1,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Cash Reserve Goal: $${cashReserveTarget.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 3: Business Loan Principal Reduction
      await prisma.goal.create({
        data: {
          name: 'Reduce Business Loan Principal',
          description: 'Pay down $50,000 of the $200,000 business loan (6.5% APR) ahead of schedule. This will save $16,250 in interest over the loan term and improve debt-to-income ratio.',
          targetAmount: 50000,
          currentAmount: 0,
          targetDate: new Date('2026-12-31'),
          type: 'DEBT_PAYOFF',
          priority: 2,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Loan Principal Reduction Goal: $50,000`);
      totalGoalsCreated++;

      // Goal 4: Revenue Growth Target
      const revenueGrowthTarget = business.totalIncome * 1.20; // 20% growth
      await prisma.goal.create({
        data: {
          name: '20% Revenue Growth in 2025',
          description: 'Increase annual revenue from $403,759 to $484,511 (20% growth). Focus on customer acquisition, retention, and premium service offerings.',
          targetAmount: Math.round(revenueGrowthTarget),
          currentAmount: Math.round(business.totalIncome),
          targetDate: new Date('2025-12-31'),
          type: 'SAVINGS',
          priority: 2,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Revenue Growth Goal: $${revenueGrowthTarget.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 5: Marketing & Growth Investment
      const marketingBudget = business.totalIncome * 0.10; // 10% of revenue
      await prisma.goal.create({
        data: {
          name: 'Marketing & Growth Investment',
          description: 'Invest $40,376 (10% of revenue) in marketing, advertising, and business development. Industry best practice for sports facilities to drive customer acquisition and retention.',
          targetAmount: Math.round(marketingBudget),
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'INVESTMENT',
          priority: 2,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Marketing Investment Goal: $${marketingBudget.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 6: Equipment & Facility Upgrade Fund
      await prisma.goal.create({
        data: {
          name: 'Equipment Upgrade Reserve',
          description: 'Set aside $30,000 for facility improvements, equipment purchases, and maintenance. Maintaining top-tier facilities is critical for member satisfaction and retention.',
          targetAmount: 30000,
          currentAmount: 0,
          targetDate: new Date('2026-06-30'),
          type: 'SAVINGS',
          priority: 3,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Equipment Upgrade Goal: $30,000`);
      totalGoalsCreated++;

      // Goal 7: Profit Distribution / Owner Pay
      const targetProfitMargin = business.totalIncome * 0.15; // 15% net margin
      await prisma.goal.create({
        data: {
          name: 'Achieve 15% Net Profit Margin',
          description: 'Target $60,564 in net profit (15% margin). This allows for owner distributions, reinvestment, and buffer against market fluctuations. Industry benchmark for profitable sports facilities.',
          targetAmount: Math.round(targetProfitMargin),
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'SAVINGS',
          priority: 2,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Profit Margin Goal: $${targetProfitMargin.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 8: Tax Optimization Reserve
      const taxReserve = business.totalIncome * 0.25; // 25% for taxes
      await prisma.goal.create({
        data: {
          name: 'Tax Reserve Fund',
          description: 'Set aside $100,940 (25% of revenue) for federal, state, and local taxes. Prevents cash flow issues at tax time and enables strategic tax planning.',
          targetAmount: Math.round(taxReserve),
          currentAmount: 0,
          targetDate: new Date('2025-12-31'),
          type: 'SAVINGS',
          priority: 1,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Tax Reserve Goal: $${taxReserve.toLocaleString()}`);
      totalGoalsCreated++;

      // Goal 9: Business Expansion Fund
      await prisma.goal.create({
        data: {
          name: 'Expansion/Acquisition Fund',
          description: 'Build $100,000 war chest for strategic expansion opportunities - new location, equipment, programs, or acquisition of complementary businesses.',
          targetAmount: 100000,
          currentAmount: 0,
          targetDate: new Date('2027-12-31'),
          type: 'INVESTMENT',
          priority: 3,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Expansion Fund Goal: $100,000`);
      totalGoalsCreated++;

      // Goal 10: Emergency Business Line Usage Reduction
      await prisma.goal.create({
        data: {
          name: 'Maintain Zero Balance on Credit Lines',
          description: 'Keep $125,000 in available credit ($75K + $50K lines) at zero balance. Reserve for true emergencies only. Preserves credit capacity and avoids unnecessary interest.',
          targetAmount: 125000,
          currentAmount: 125000,
          targetDate: new Date('2025-12-31'),
          type: 'SAVINGS',
          priority: 1,
          isCompleted: true,
          businessProfileId: businessProfile.id,
          userId: user.id
        }
      });
      console.log(`✅ Credit Line Management Goal: $125,000 (COMPLETED)`);
      totalGoalsCreated++;

      console.log(`\n📊 Total Business Goals Created: ${10}`);
    }

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`✅ FINANCIAL GOALS POPULATION COMPLETE`);
    console.log('═'.repeat(70));
    console.log(`\n🎯 Total Goals Created: ${totalGoalsCreated}`);
    console.log(`   • Personal/Household: 7 goals`);
    console.log(`   • The House of Sports: 10 goals`);
    
    console.log(`\n💼 CFO STRATEGIC PRIORITIES:`);
    console.log(`   1. 🚨 IMMEDIATE: Pay off high-interest credit cards ($24,639 @ 19% APR)`);
    console.log(`   2. 🛡️  FOUNDATIONAL: Build emergency funds (Personal: $18K, Business: $60K)`);
    console.log(`   3. 📈 GROWTH: Invest in marketing ($40K) and revenue expansion (20% target)`);
    console.log(`   4. 💰 WEALTH: Max retirement savings ($18K) and build investment portfolio`);
    console.log(`   5. 🏦 STABILITY: Maintain cash reserves and zero-balance credit lines`);
    console.log(`   6. 🎯 LONG-TERM: Business expansion fund ($100K) and home down payment ($50K)`);

    console.log(`\n📊 PROJECTED 2025 OUTCOMES:`);
    const totalIncome = analysis.combined.totalIncome;
    const estimatedSavings = totalIncome * 0.20; // Conservative 20% savings rate
    console.log(`   • Total Income: $${totalIncome.toLocaleString()}`);
    console.log(`   • Target Savings: $${estimatedSavings.toLocaleString()} (20% rate)`);
    console.log(`   • Debt Reduction: $74,639 (if all debt goals met)`);
    console.log(`   • Net Worth Increase: $${(estimatedSavings - 74639).toLocaleString()}`);

    console.log(`\n✅ All goals are now visible in the Financial Goals dashboard!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

await populateFinancialGoals();
