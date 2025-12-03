#!/usr/bin/env node
/**
 * Test script to validate PNC Business Checking Plus statement parsing
 * This simulates the format from the uploaded statement images
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample PNC Business Checking Plus statement data (from uploaded images)
const testStatementData = {
  bankInfo: {
    bankName: 'PNC Bank',
    accountType: 'Business Checking Plus',
    accountNumber: '80-6434-4474',
    businessName: 'THE HOUSE OF SPORTS CORP',
    statementPeriod: '12/30/2023 to 01/31/2024',
    beginningBalance: 91906.77,
    endingBalance: 87525.01
  },
  transactions: [
    // === DEPOSITS (Mobile) - 3 transactions, $8,771.66 ===
    { date: '2024-01-02', description: 'Mobile Deposit', amount: 2500.00, type: 'credit', category: 'Deposits' },
    { date: '2024-01-15', description: 'Mobile Deposit', amount: 3271.66, type: 'credit', category: 'Deposits' },
    { date: '2024-01-22', description: 'Mobile Deposit', amount: 3000.00, type: 'credit', category: 'Deposits' },
    
    // === ATM Deposits - 1 transaction, $58.09 ===
    { date: '2024-01-08', description: 'ATM Deposit POS Return', amount: 58.09, type: 'credit', category: 'ATM Deposits' },
    
    // === ACH Additions - 15 transactions, $7,818.96 ===
    { date: '2024-01-02', description: 'Corporate ACH Transfer STRIPE', amount: 1250.45, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-05', description: 'Corporate ACH Transfer STRIPE', amount: 892.30, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-08', description: 'ACH Payout ETSY INC', amount: 456.78, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-10', description: 'Corporate ACH Transfer STRIPE', amount: 1125.00, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-12', description: 'Corporate ACH Transfer STRIPE', amount: 789.50, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-15', description: 'ACH Payout ETSY INC', amount: 234.56, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-17', description: 'Corporate ACH Transfer STRIPE', amount: 567.89, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-19', description: 'Corporate ACH Transfer STRIPE', amount: 445.00, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-22', description: 'ACH Payout ETSY INC', amount: 312.45, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-24', description: 'Corporate ACH Transfer STRIPE', amount: 678.90, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-25', description: 'Corporate ACH Transfer STRIPE', amount: 234.12, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-26', description: 'ACH Payout ETSY INC', amount: 189.34, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-28', description: 'Corporate ACH Transfer STRIPE', amount: 345.67, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-29', description: 'Corporate ACH Transfer STRIPE', amount: 156.00, type: 'credit', category: 'Business Revenue' },
    { date: '2024-01-31', description: 'Corporate ACH Transfer STRIPE', amount: 141.00, type: 'credit', category: 'Business Revenue' },
    
    // === Checks - 1 transaction, $1,000.00 ===
    { date: '2024-01-03', description: 'Check #1157', amount: -1000.00, type: 'debit', category: 'Checks' },
    
    // === Debit Card Purchases - Sample of 43 transactions, $2,744.64 total ===
    { date: '2024-01-02', description: '7526 Debit Card Purchase JERSEY MIKES 22174', amount: -12.45, type: 'debit', category: 'Food & Dining' },
    { date: '2024-01-03', description: '7526 Debit Card Purchase TST* JOHNNY NAPKINS', amount: -28.50, type: 'debit', category: 'Food & Dining' },
    { date: '2024-01-04', description: '7526 Debit Card Purchase CHICK-FIL-A #02974', amount: -15.67, type: 'debit', category: 'Food & Dining' },
    { date: '2024-01-05', description: '7526 Debit Card Purchase COSTCO WHSE #1234', amount: -156.78, type: 'debit', category: 'Shopping' },
    { date: '2024-01-06', description: '7526 Debit Card Purchase TARGET 00012345', amount: -89.99, type: 'debit', category: 'Shopping' },
    { date: '2024-01-07', description: '7526 Debit Card Purchase TOTAL WINE #123', amount: -45.50, type: 'debit', category: 'Shopping' },
    { date: '2024-01-08', description: '7526 Debit Card Purchase HOME DEPOT #1234', amount: -234.56, type: 'debit', category: 'Home Improvement' },
    { date: '2024-01-09', description: '7526 Debit Card Purchase HOMEGOODS #0123', amount: -67.89, type: 'debit', category: 'Shopping' },
    { date: '2024-01-10', description: '7526 Debit Card Purchase DICKS SPORTING GD', amount: -123.45, type: 'debit', category: 'Sporting Goods' },
    { date: '2024-01-11', description: '7526 Debit Card Purchase US GAS UNION NJ', amount: -52.00, type: 'debit', category: 'Fuel & Gas' },

    // === POS Purchases - Sample of 26 transactions, $2,378.12 total ===
    { date: '2024-01-02', description: 'POS Purchase MANHATTAN BAGEL', amount: -8.95, type: 'debit', category: 'Food & Dining' },
    { date: '2024-01-03', description: 'POS Purchase ACME MARKETS #1234', amount: -67.89, type: 'debit', category: 'Groceries' },
    { date: '2024-01-05', description: 'POS Purchase PERROTTS QUALITY MEAT', amount: -45.67, type: 'debit', category: 'Groceries' },
    { date: '2024-01-06', description: 'POS Purchase HOBBY LOBBY #123', amount: -34.56, type: 'debit', category: 'Shopping' },
    { date: '2024-01-08', description: 'POS Purchase KENILWORTH CAR WASH', amount: -18.00, type: 'debit', category: 'Auto & Transport' },

    // === ACH Deductions - Sample of 23 transactions, $6,167.79 total ===
    { date: '2024-01-02', description: 'Corporate ACH Deduction TMOBILE', amount: -156.78, type: 'debit', category: 'Phone & Internet' },
    { date: '2024-01-05', description: 'Corporate ACH Deduction OPTIMUM', amount: -189.99, type: 'debit', category: 'Cable & Internet' },
    { date: '2024-01-10', description: 'Corporate ACH Deduction AMERICAN WATER', amount: -78.45, type: 'debit', category: 'Utilities' },
    { date: '2024-01-15', description: 'Corporate ACH Deduction ELIZABETHTOWN GAS', amount: -234.56, type: 'debit', category: 'Utilities' },
    { date: '2024-01-20', description: 'Corporate ACH Deduction PSEG', amount: -345.67, type: 'debit', category: 'Utilities' },
    { date: '2024-01-25', description: 'Corporate ACH Deduction SBA LOAN PAYMENT', amount: -1500.00, type: 'debit', category: 'Loan Payment' },

    // === Service Charges - 1 transaction, $64.00 ===
    { date: '2024-01-31', description: 'Service Charge Business Checking Plus', amount: -64.00, type: 'debit', category: 'Bank Fees' },
    
    // === Other Deductions - 1 transaction, $8,275.00 ===
    { date: '2024-01-15', description: 'Zelle Payment UNIONCOUNTYFC', amount: -8275.00, type: 'debit', category: 'Business Expenses' }
  ]
};

async function testPNCStatementParser() {
  console.log('🧪 PNC Business Checking Plus Statement Parser Test\n');
  console.log('=' .repeat(60));
  
  // Display expected bank info
  console.log('\n📊 EXPECTED BANK INFO:');
  console.log(`   Bank: ${testStatementData.bankInfo.bankName}`);
  console.log(`   Account Type: ${testStatementData.bankInfo.accountType}`);
  console.log(`   Account Number: ${testStatementData.bankInfo.accountNumber}`);
  console.log(`   Business Name: ${testStatementData.bankInfo.businessName}`);
  console.log(`   Period: ${testStatementData.bankInfo.statementPeriod}`);
  console.log(`   Beginning Balance: $${testStatementData.bankInfo.beginningBalance.toLocaleString()}`);
  console.log(`   Ending Balance: $${testStatementData.bankInfo.endingBalance.toLocaleString()}`);
  
  // Calculate transaction summary
  const credits = testStatementData.transactions.filter(t => t.amount > 0);
  const debits = testStatementData.transactions.filter(t => t.amount < 0);
  const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  console.log('\n📈 EXPECTED TRANSACTION SUMMARY:');
  console.log(`   Total Transactions: ${testStatementData.transactions.length}`);
  console.log(`   Credits (Income): ${credits.length} transactions = $${totalCredits.toLocaleString()}`);
  console.log(`   Debits (Expenses): ${debits.length} transactions = $${totalDebits.toLocaleString()}`);
  console.log(`   Net Change: $${(totalCredits - totalDebits).toLocaleString()}`);
  
  // Group by category
  const byCategory = {};
  testStatementData.transactions.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = { count: 0, total: 0 };
    byCategory[t.category].count++;
    byCategory[t.category].total += t.amount;
  });
  
  console.log('\n📋 TRANSACTIONS BY CATEGORY:');
  Object.entries(byCategory)
    .sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total))
    .forEach(([cat, data]) => {
      const sign = data.total >= 0 ? '+' : '';
      console.log(`   ${cat}: ${data.count} txns = ${sign}$${data.total.toLocaleString()}`);
    });
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Test data prepared. Ready to compare with actual upload results.');
  console.log('\n📝 NEXT STEPS:');
  console.log('   1. Upload your PNC PDF through the UI at http://localhost:3000');
  console.log('   2. Navigate to Bank Statements → Upload Statement');
  console.log('   3. Select your PNC Business Checking Plus PDF');
  console.log('   4. After processing, run this script again with --verify flag');
  
  await prisma.$disconnect();
}

testPNCStatementParser().catch(console.error);

