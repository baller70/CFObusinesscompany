import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixPersonalCategories() {
  try {
    console.log('\n🔧 FIXING PERSONAL FINANCE CATEGORIES\n');
    console.log('=' .repeat(60));

    // Get user and personal profile
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    const personalProfile = user.businessProfiles.find(p => p.type === 'PERSONAL');
    
    if (!personalProfile) {
      console.log('❌ No personal profile found');
      return;
    }

    console.log(`\n🏠 Personal Profile: ${personalProfile.name}`);
    console.log(`📊 Profile ID: ${personalProfile.id}`);

    // Get all unique categories from transactions
    const transactions = await prisma.transaction.findMany({
      where: { businessProfileId: personalProfile.id },
      select: { category: true, type: true }
    });

    const uniqueCategories = {};
    transactions.forEach(t => {
      if (t.category && t.category !== 'Uncategorized') {
        if (!uniqueCategories[t.category]) {
          uniqueCategories[t.category] = t.type || 'EXPENSE';
        }
      }
    });

    console.log(`\n📋 Found ${Object.keys(uniqueCategories).length} unique categories in transactions`);
    console.log('Categories:', Object.keys(uniqueCategories).join(', '));

    // Category icon mapping
    const categoryIcons = {
      'Income': { icon: 'DollarSign', color: '#10B981' },
      'Salary': { icon: 'DollarSign', color: '#10B981' },
      'Other Expenses': { icon: 'Receipt', color: '#6B7280' },
      'Shopping': { icon: 'ShoppingBag', color: '#8B5CF6' },
      'Groceries': { icon: 'ShoppingCart', color: '#F59E0B' },
      'Dining & Restaurants': { icon: 'UtensilsCrossed', color: '#EF4444' },
      'Healthcare': { icon: 'Heart', color: '#EC4899' },
      'Subscriptions': { icon: 'RefreshCw', color: '#6366F1' },
      'Bills & Utilities': { icon: 'FileText', color: '#14B8A6' },
      'Gas & Fuel': { icon: 'Fuel', color: '#F97316' },
      'Transportation': { icon: 'Car', color: '#3B82F6' },
      'Personal Care': { icon: 'Sparkles', color: '#EC4899' },
      'Entertainment': { icon: 'Film', color: '#A855F7' },
      'Vehicle Maintenance': { icon: 'Wrench', color: '#64748B' },
      'Fitness & Wellness': { icon: 'Activity', color: '#10B981' },
      'Rent/Mortgage': { icon: 'Home', color: '#0EA5E9' },
      'Transfer': { icon: 'ArrowLeftRight', color: '#6B7280' },
      'Savings': { icon: 'PiggyBank', color: '#10B981' },
      'Investment': { icon: 'TrendingUp', color: '#059669' },
      'Education': { icon: 'GraduationCap', color: '#3B82F6' },
      'Insurance': { icon: 'Shield', color: '#6366F1' },
      'Taxes': { icon: 'Calculator', color: '#EF4444' },
      'Gifts': { icon: 'Gift', color: '#EC4899' },
      'Travel': { icon: 'Plane', color: '#0EA5E9' },
      'Home Improvement': { icon: 'Hammer', color: '#F59E0B' },
      'Pet Care': { icon: 'Dog', color: '#F97316' },
      'Childcare': { icon: 'Baby', color: '#EC4899' }
    };

    // Create categories
    console.log('\n' + '='.repeat(60));
    console.log('🔨 CREATING CATEGORIES');
    console.log('='.repeat(60));

    let created = 0;
    let skipped = 0;

    for (const [categoryName, type] of Object.entries(uniqueCategories)) {
      try {
        const iconData = categoryIcons[categoryName] || { icon: 'Tag', color: '#6B7280' };
        
        const existing = await prisma.category.findFirst({
          where: {
            name: categoryName,
            businessProfileId: personalProfile.id
          }
        });

        if (existing) {
          console.log(`  ⏭️  Skipped: ${categoryName} (already exists)`);
          skipped++;
        } else {
          await prisma.category.create({
            data: {
              name: categoryName,
              type: type,
              icon: iconData.icon,
              color: iconData.color,
              userId: user.id,
              businessProfileId: personalProfile.id,
              isDefault: false
            }
          });
          console.log(`  ✅ Created: ${categoryName} (${type}) - ${iconData.icon}`);
          created++;
        }
      } catch (error) {
        console.error(`  ❌ Failed to create ${categoryName}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Category Creation Complete`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('='.repeat(60));

    // Verify final state
    const finalCategories = await prisma.category.findMany({
      where: { businessProfileId: personalProfile.id }
    });

    console.log(`\n📊 Final Category Count: ${finalCategories.length}`);
    console.log('\nCategories in Database:');
    finalCategories.forEach(c => {
      console.log(`  ${c.icon} ${c.name} (${c.type}) - ${c.color}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE - Personal Finance Categories Synced!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPersonalCategories();
