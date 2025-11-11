import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testCategoriesAPI() {
  try {
    console.log('\n🧪 TESTING CATEGORIES API LOGIC\n');
    
    // Get user and active profile
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: {
        businessProfiles: {
          where: { isActive: true },
          take: 1
        }
      }
    });
    
    if (!user || !user.businessProfiles[0]) {
      console.log('❌ No active profile found');
      return;
    }
    
    const activeProfile = user.businessProfiles[0];
    console.log(`✅ Active Profile: ${activeProfile.name} (${activeProfile.type})\n`);
    
    // Fetch categories for active profile
    const categories = await prisma.category.findMany({
      where: {
        businessProfileId: activeProfile.id
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`📋 Found ${categories.length} categories for this profile\n`);
    
    // Fetch all transactions for this profile
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: activeProfile.id
      },
      select: {
        id: true,
        amount: true,
        category: true,
        type: true
      }
    });
    
    console.log(`💰 Found ${transactions.length} transactions for this profile\n`);
    
    // Test the grouping logic (same as API)
    const categoriesWithData = categories.map(category => {
      const categoryTransactions = transactions.filter(
        tx => tx.category && tx.category.trim() === category.name
      );
      
      const totalAmount = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      return {
        name: category.name,
        type: category.type,
        transactionCount: categoryTransactions.length,
        totalAmount: totalAmount
      };
    });
    
    console.log('📊 CATEGORIES WITH TRANSACTION DATA:\n');
    
    const incomeCategories = categoriesWithData.filter(c => c.type === 'INCOME');
    const expenseCategories = categoriesWithData.filter(c => c.type === 'EXPENSE');
    
    console.log(`💰 INCOME CATEGORIES (${incomeCategories.length}):\n`);
    incomeCategories.forEach(cat => {
      console.log(`   ${cat.name}: ${cat.transactionCount} txns, $${cat.totalAmount.toLocaleString()}`);
    });
    
    console.log(`\n💸 EXPENSE CATEGORIES (${expenseCategories.length}):\n`);
    expenseCategories.forEach(cat => {
      console.log(`   ${cat.name}: ${cat.transactionCount} txns, $${Math.abs(cat.totalAmount).toLocaleString()}`);
    });
    
    // Check if any categories have zero transactions
    const emptyCategories = categoriesWithData.filter(c => c.transactionCount === 0);
    if (emptyCategories.length > 0) {
      console.log(`\n⚠️  CATEGORIES WITH ZERO TRANSACTIONS (${emptyCategories.length}):\n`);
      emptyCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type})`);
      });
    } else {
      console.log('\n✅ All categories have transactions!');
    }
    
    console.log('\n✅ API LOGIC TEST COMPLETE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoriesAPI();
