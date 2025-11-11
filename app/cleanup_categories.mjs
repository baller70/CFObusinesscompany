import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function cleanupCategories() {
  try {
    console.log('\n🧹 CLEANING UP CATEGORIES\n');
    
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
    
    // Get used categories
    const usedCategories = new Set();
    transactions.forEach(tx => {
      if (tx.category && tx.category.trim() !== '') {
        usedCategories.add(tx.category.trim());
      }
    });
    
    console.log(`✅ Found ${usedCategories.size} categories in use across ${transactions.length} transactions\n`);
    
    // Get all categories from database
    const allCategories = await prisma.category.findMany({
      where: { userId: user.id }
    });
    
    console.log(`📋 Total categories in database: ${allCategories.length}\n`);
    
    // Identify unused categories
    const unusedCategories = allCategories.filter(c => !usedCategories.has(c.name));
    
    console.log(`🗑️  Categories to delete: ${unusedCategories.length}\n`);
    
    if (unusedCategories.length > 0) {
      console.log('Deleting unused categories:\n');
      
      for (const cat of unusedCategories) {
        await prisma.category.delete({
          where: { id: cat.id }
        });
        console.log(`   ✓ Deleted: ${cat.name} (${cat.type})`);
      }
      
      console.log(`\n✅ Successfully deleted ${unusedCategories.length} unused categories\n`);
    }
    
    // Show remaining categories
    const remainingCategories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n📊 REMAINING CATEGORIES: ${remainingCategories.length}\n`);
    remainingCategories.forEach(cat => {
      const usage = transactions.filter(t => t.category === cat.name).length;
      console.log(`   ${cat.name} (${cat.type}): ${usage} transactions`);
    });
    
    console.log('\n✅ CLEANUP COMPLETE!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCategories();
