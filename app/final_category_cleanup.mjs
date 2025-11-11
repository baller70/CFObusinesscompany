import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function finalCategoryCleanup() {
  try {
    console.log('\n🧹 FINAL CATEGORY CLEANUP\n');
    
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
    
    // Build the correct category structure based on transactions
    const categoryUsage = {};
    transactions.forEach(tx => {
      if (tx.category && tx.category.trim() !== '') {
        const catName = tx.category.trim();
        if (!categoryUsage[catName]) {
          categoryUsage[catName] = {
            name: catName,
            type: tx.type, // Use the transaction type (INCOME or EXPENSE)
            count: 0,
            color: tx.categoryColor || '#6B7280',
            icon: tx.categoryIcon || 'DollarSign'
          };
        }
        categoryUsage[catName].count++;
      }
    });
    
    console.log(`✅ Found ${Object.keys(categoryUsage).length} unique categories from transactions\n`);
    
    // Delete ALL existing categories
    const deletedCount = await prisma.category.deleteMany({
      where: { userId: user.id }
    });
    
    console.log(`🗑️  Deleted all ${deletedCount.count} existing categories\n`);
    
    // Recreate categories with correct types
    console.log('Creating clean categories:\n');
    
    const sortedCategories = Object.entries(categoryUsage).sort((a, b) => b[1].count - a[1].count);
    
    for (const [name, data] of sortedCategories) {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: name,
          type: data.type,
          color: data.color,
          icon: data.icon
        }
      });
      console.log(`   ✓ Created: ${name} (${data.type}) - ${data.count} transactions`);
    }
    
    console.log(`\n✅ Successfully created ${sortedCategories.length} clean categories\n`);
    
    // Verify final state
    const finalCategories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n📊 FINAL CATEGORY COUNT: ${finalCategories.length}\n`);
    
    // Group by type
    const incomeCategories = finalCategories.filter(c => c.type === 'INCOME');
    const expenseCategories = finalCategories.filter(c => c.type === 'EXPENSE');
    
    console.log(`💰 INCOME CATEGORIES (${incomeCategories.length}):`);
    incomeCategories.forEach(cat => {
      const usage = transactions.filter(t => t.category === cat.name && t.type === 'INCOME').length;
      console.log(`   • ${cat.name}: ${usage} transactions`);
    });
    
    console.log(`\n💸 EXPENSE CATEGORIES (${expenseCategories.length}):`);
    expenseCategories.forEach(cat => {
      const usage = transactions.filter(t => t.category === cat.name && t.type === 'EXPENSE').length;
      console.log(`   • ${cat.name}: ${usage} transactions`);
    });
    
    console.log('\n✅ CLEANUP COMPLETE! Categories are now clean and organized.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCategoryCleanup();
