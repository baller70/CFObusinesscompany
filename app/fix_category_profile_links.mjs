import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixCategoryProfileLinks() {
  try {
    console.log('\n🔧 FIXING CATEGORY PROFILE LINKS\n');
    
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
    console.log(`📁 Business Profiles:`);
    user.businessProfiles.forEach(p => {
      console.log(`   - ${p.name} (${p.type}): ${p.id}`);
    });
    
    // Get all transactions to determine which profile each category belongs to
    const transactions = await prisma.transaction.findMany({
      where: {
        businessProfileId: {
          in: user.businessProfiles.map(p => p.id)
        }
      }
    });
    
    console.log(`\n💰 Found ${transactions.length} transactions\n`);
    
    // Get all categories that belong to this user
    const categories = await prisma.category.findMany({
      where: { userId: user.id }
    });
    
    console.log(`📋 Found ${categories.length} categories to update\n`);
    
    // Map categories to profiles based on transactions
    const categoryProfileMap = {};
    
    transactions.forEach(tx => {
      if (tx.category && tx.category.trim() !== '') {
        const catName = tx.category.trim();
        if (!categoryProfileMap[catName]) {
          categoryProfileMap[catName] = {};
        }
        const profileId = tx.businessProfileId;
        if (!categoryProfileMap[catName][profileId]) {
          categoryProfileMap[catName][profileId] = 0;
        }
        categoryProfileMap[catName][profileId]++;
      }
    });
    
    console.log('🔄 Updating categories with business profile IDs:\n');
    
    for (const category of categories) {
      const profileCounts = categoryProfileMap[category.name] || {};
      
      // Find the profile with the most transactions for this category
      let maxCount = 0;
      let primaryProfileId = user.businessProfiles[0].id; // Default to first profile
      
      for (const [profileId, count] of Object.entries(profileCounts)) {
        if (count > maxCount) {
          maxCount = count;
          primaryProfileId = profileId;
        }
      }
      
      const profileInfo = user.businessProfiles.find(p => p.id === primaryProfileId);
      
      // Update category with businessProfileId
      await prisma.category.update({
        where: { id: category.id },
        data: { businessProfileId: primaryProfileId }
      });
      
      console.log(`   ✓ ${category.name} (${category.type}) → ${profileInfo?.name} (${maxCount} txns)`);
    }
    
    console.log('\n✅ All categories updated with business profile links!\n');
    
    // Verify the fix
    const businessProfile = user.businessProfiles.find(p => p.type === 'BUSINESS');
    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    
    if (businessProfile) {
      const businessCategories = await prisma.category.findMany({
        where: { businessProfileId: businessProfile.id },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });
      console.log(`📊 ${businessProfile.name} has ${businessCategories.length} categories`);
      businessCategories.forEach(cat => {
        console.log(`   • ${cat.name}: ${cat._count.transactions} transactions`);
      });
    }
    
    if (personalProfile) {
      const personalCategories = await prisma.category.findMany({
        where: { businessProfileId: personalProfile.id },
        include: {
          _count: {
            select: { transactions: true }
          }
        }
      });
      console.log(`\n📊 ${personalProfile.name} has ${personalCategories.length} categories`);
      personalCategories.forEach(cat => {
        console.log(`   • ${cat.name}: ${cat._count.transactions} transactions`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCategoryProfileLinks();
