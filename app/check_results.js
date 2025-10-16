
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResults() {
  try {
    console.log('📊 Checking reprocessing results...\n');
    
    // Get user
    const user = await prisma.user.findFirst({
      where: { email: 'khouston721@gmail.com' }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    // Get profiles
    const profiles = await prisma.businessProfile.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { 
            transactions: true,
            bankStatements: true
          }
        }
      }
    });
    
    console.log('📋 PROFILES:\n');
    for (const profile of profiles) {
      console.log(`${profile.type === 'BUSINESS' ? '🏢' : '🏠'} ${profile.name}`);
      console.log(`   Type: ${profile.type}`);
      console.log(`   Transactions: ${profile._count.transactions}`);
      console.log(`   Statements: ${profile._count.bankStatements}`);
    }
    
    // Get statements
    const statements = await prisma.bankStatement.findMany({
      where: { userId: user.id },
      include: {
        businessProfile: true,
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('\n\n📄 STATEMENTS:\n');
    for (const stmt of statements) {
      console.log(`📊 ${stmt.fileName}`);
      console.log(`   Status: ${stmt.status}`);
      console.log(`   Stage: ${stmt.processingStage}`);
      console.log(`   Transactions: ${stmt._count.transactions}`);
      console.log(`   Uploaded to: ${stmt.businessProfile?.name || 'None'}`);
    }
    
    // Get transaction breakdown by profile
    console.log('\n\n💰 TRANSACTION BREAKDOWN:\n');
    
    for (const profile of profiles) {
      const transactions = await prisma.transaction.findMany({
        where: { 
          userId: user.id,
          businessProfileId: profile.id
        },
        include: {
          bankStatement: true
        }
      });
      
      console.log(`\n${profile.type === 'BUSINESS' ? '🏢' : '🏠'} ${profile.name} (${transactions.length} transactions):`);
      
      if (transactions.length > 0) {
        const income = transactions.filter(t => t.type === 'INCOME');
        const expenses = transactions.filter(t => t.type === 'EXPENSE');
        const incomeTotal = income.reduce((sum, t) => sum + (t.amount || 0), 0);
        const expenseTotal = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
        
        console.log(`   Income: ${income.length} transactions, $${incomeTotal.toFixed(2)}`);
        console.log(`   Expenses: ${expenses.length} transactions, $${expenseTotal.toFixed(2)}`);
        
        // Group by statement
        const byStatement = {};
        for (const txn of transactions) {
          const stmtName = txn.bankStatement?.fileName || 'Unknown';
          if (!byStatement[stmtName]) {
            byStatement[stmtName] = [];
          }
          byStatement[stmtName].push(txn);
        }
        
        console.log(`   From statements:`);
        for (const [stmtName, txns] of Object.entries(byStatement)) {
          console.log(`      - ${stmtName}: ${txns.length} transactions`);
        }
      }
    }
    
    // Check recurring charges
    const recurringCharges = await prisma.recurringCharge.findMany({
      where: { userId: user.id },
      include: {
        businessProfile: true
      }
    });
    
    console.log('\n\n🔄 RECURRING CHARGES:\n');
    const businessCharges = recurringCharges.filter(rc => rc.businessProfile?.type === 'BUSINESS');
    const personalCharges = recurringCharges.filter(rc => rc.businessProfile?.type === 'PERSONAL');
    
    console.log(`🏢 Business: ${businessCharges.length} recurring charges`);
    businessCharges.forEach(rc => {
      console.log(`   - ${rc.name}: $${rc.amount.toFixed(2)} ${rc.frequency}`);
    });
    
    console.log(`\n🏠 Personal: ${personalCharges.length} recurring charges`);
    personalCharges.forEach(rc => {
      console.log(`   - ${rc.name}: $${rc.amount.toFixed(2)} ${rc.frequency}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkResults();
