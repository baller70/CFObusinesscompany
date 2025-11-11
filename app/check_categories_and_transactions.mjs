import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkCategoriesAndTransactions() {
  try {
    console.log('\n📊 CHECKING CATEGORIES AND TRANSACTIONS\n');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User: ${user.email}`);
    console.log(`📁 Business Profiles: ${user.businessProfiles.length}`);
    
    // Get all categories
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n📋 TOTAL CATEGORIES: ${categories.length}\n`);
    
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: {
          in: user.businessProfiles.map(p => p.id)
        }
      },
      include: {
        businessProfile: true
      }
    });
    
    console.log(`💰 TOTAL TRANSACTIONS: ${transactions.length}\n`);
    
    // Analyze category usage
    const categoryUsage = {};
    const uncategorized = [];
    
    transactions.forEach(tx => {
      if (tx.category && tx.category.trim() !== '') {
        const cat = tx.category.trim();
        if (!categoryUsage[cat]) {
          categoryUsage[cat] = {
            count: 0,
            totalAmount: 0,
            profile: tx.businessProfile.type
          };
        }
        categoryUsage[cat].count++;
        categoryUsage[cat].totalAmount += Math.abs(parseFloat(tx.amount));
      } else {
        uncategorized.push(tx);
      }
    });
    
    console.log('📊 CATEGORIES ACTUALLY USED IN TRANSACTIONS:\n');
    const sortedUsage = Object.entries(categoryUsage)
      .sort((a, b) => b[1].count - a[1].count);
    
    sortedUsage.forEach(([cat, data]) => {
      console.log(`   ${cat}: ${data.count} transactions, $${data.totalAmount.toFixed(2)}, ${data.profile}`);
    });
    
    console.log(`\n⚠️  UNCATEGORIZED TRANSACTIONS: ${uncategorized.length}\n`);
    
    // Show categories in database that are NOT used
    const usedCategoryNames = new Set(Object.keys(categoryUsage));
    const unusedCategories = categories.filter(c => !usedCategoryNames.has(c.name));
    
    console.log(`\n🗑️  UNUSED CATEGORIES IN DATABASE: ${unusedCategories.length}\n`);
    if (unusedCategories.length > 0) {
      unusedCategories.slice(0, 20).forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type})`);
      });
      if (unusedCategories.length > 20) {
        console.log(`   ... and ${unusedCategories.length - 20} more`);
      }
    }
    
    // Show sample uncategorized transactions
    if (uncategorized.length > 0) {
      console.log('\n📝 SAMPLE UNCATEGORIZED TRANSACTIONS:\n');
      uncategorized.slice(0, 10).forEach(tx => {
        console.log(`   ${tx.date} | ${tx.description} | $${tx.amount} | ${tx.type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoriesAndTransactions();
