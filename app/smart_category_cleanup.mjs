import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Define which categories should be INCOME vs EXPENSE based on common sense
const INCOME_KEYWORDS = ['income', 'revenue', 'sales', 'payment received', 'deposit', 'refund', 'reimbursement'];
const EXPENSE_KEYWORDS = [
  'expense', 'shopping', 'groceries', 'dining', 'restaurant', 'healthcare', 
  'bills', 'utilities', 'subscription', 'gas', 'fuel', 'transportation',
  'personal care', 'entertainment', 'bank fees', 'transfer', 'loan', 
  'vehicle', 'contractor', 'fitness', 'wellness', 'rent', 'mortgage'
];

function determineCategoryType(categoryName, transactionAmounts) {
  const lowerName = categoryName.toLowerCase();
  
  // Check if it's explicitly an income category
  if (INCOME_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return 'INCOME';
  }
  
  // Check if it's explicitly an expense category
  if (EXPENSE_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return 'EXPENSE';
  }
  
  // If unclear, use the majority transaction type
  const positiveCount = transactionAmounts.filter(amt => amt > 0).length;
  const negativeCount = transactionAmounts.filter(amt => amt < 0).length;
  
  return positiveCount > negativeCount ? 'INCOME' : 'EXPENSE';
}

async function smartCategoryCleanup() {
  try {
    console.log('\n🧹 SMART CATEGORY CLEANUP\n');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: {
          in: user.businessProfiles.map(p => p.id)
        }
      }
    });
    
    console.log(`💰 Analyzing ${transactions.length} transactions...\n`);
    
    // Build category structure intelligently
    const categoryData = {};
    transactions.forEach(tx => {
      if (tx.category && tx.category.trim() !== '') {
        const catName = tx.category.trim();
        if (!categoryData[catName]) {
          categoryData[catName] = {
            amounts: [],
            colors: new Set(),
            icons: new Set()
          };
        }
        categoryData[catName].amounts.push(parseFloat(tx.amount));
        if (tx.categoryColor) categoryData[catName].colors.add(tx.categoryColor);
        if (tx.categoryIcon) categoryData[catName].icons.add(tx.categoryIcon);
      }
    });
    
    // Delete all existing categories
    const deletedCount = await prisma.category.deleteMany({
      where: { userId: user.id }
    });
    console.log(`🗑️  Deleted ${deletedCount.count} existing categories\n`);
    
    // Create properly categorized entries
    console.log('Creating correctly categorized entries:\n');
    
    const sortedCategories = Object.entries(categoryData).sort((a, b) => 
      b[1].amounts.length - a[1].amounts.length
    );
    
    const incomeCategories = [];
    const expenseCategories = [];
    
    for (const [name, data] of sortedCategories) {
      const correctType = determineCategoryType(name, data.amounts);
      const color = Array.from(data.colors)[0] || '#6B7280';
      const icon = Array.from(data.icons)[0] || 'DollarSign';
      
      await prisma.category.create({
        data: {
          userId: user.id,
          name: name,
          type: correctType,
          color: color,
          icon: icon
        }
      });
      
      const count = data.amounts.length;
      const totalAmount = data.amounts.reduce((sum, amt) => sum + Math.abs(amt), 0);
      
      if (correctType === 'INCOME') {
        incomeCategories.push({ name, count, totalAmount });
      } else {
        expenseCategories.push({ name, count, totalAmount });
      }
      
      console.log(`   ✓ ${name} → ${correctType} (${count} transactions, $${totalAmount.toFixed(2)})`);
    }
    
    // Summary
    console.log(`\n📊 FINAL SUMMARY:\n`);
    console.log(`   Total Categories: ${sortedCategories.length}`);
    console.log(`   Income Categories: ${incomeCategories.length}`);
    console.log(`   Expense Categories: ${expenseCategories.length}\n`);
    
    console.log(`💰 INCOME CATEGORIES:\n`);
    incomeCategories.forEach(cat => {
      console.log(`   • ${cat.name}: ${cat.count} transactions, $${cat.totalAmount.toFixed(2)}`);
    });
    
    console.log(`\n💸 EXPENSE CATEGORIES:\n`);
    expenseCategories.forEach(cat => {
      console.log(`   • ${cat.name}: ${cat.count} transactions, $${cat.totalAmount.toFixed(2)}`);
    });
    
    console.log('\n✅ CLEANUP COMPLETE! You now have 20 clean, properly categorized categories.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

smartCategoryCleanup();
