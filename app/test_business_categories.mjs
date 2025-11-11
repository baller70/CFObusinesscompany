import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testBusinessCategories() {
  try {
    console.log('\n🧪 TESTING BUSINESS PROFILE CATEGORIES\n');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
    
    if (!businessProfile) {
      console.log('❌ No business profile found');
      return;
    }
    
    console.log(`✅ Business Profile: ${businessProfile.name}\n`);
    
    // Fetch categories
    const categories = await prisma.category.findMany({
      where: {
        businessProfileId: businessProfile.id
      }
    });
    
    console.log(`📋 Found ${categories.length} categories\n`);
    
    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: businessProfile.id
      }
    });
    
    console.log(`💰 Found ${transactions.length} transactions\n`);
    
    // Group by category
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
    
    console.log('📊 BUSINESS CATEGORIES:\n');
    categoriesWithData.forEach(cat => {
      const sign = cat.type === 'INCOME' ? '+' : '';
      console.log(`   ${cat.name} (${cat.type}): ${cat.transactionCount} txns, ${sign}$${Math.abs(cat.totalAmount).toLocaleString()}`);
    });
    
    console.log('\n✅ BUSINESS PROFILE TEST COMPLETE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBusinessCategories();
