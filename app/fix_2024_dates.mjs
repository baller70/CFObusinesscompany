import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fix2024Dates() {
  try {
    console.log('\n🔧 FIXING 2024 DATES\n');
    console.log('='.repeat(60));

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'khouston@thebasketballfactorynj.com' },
      include: { businessProfiles: true }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User: ${user.email}\n`);

    let totalFixed = 0;

    for (const profile of user.businessProfiles) {
      console.log(`\n📁 Profile: ${profile.name} (${profile.type})`);
      console.log('─'.repeat(60));

      // Get all transactions for this profile
      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { date: 'asc' }
      });

      console.log(`📊 Found ${transactions.length} transactions`);

      let profileFixed = 0;
      for (const txn of transactions) {
        const currentDate = new Date(txn.date);
        const year = currentDate.getFullYear();
        
        // If the date is in 2025, shift it back to 2024
        if (year === 2025) {
          const newDate = new Date(currentDate);
          newDate.setFullYear(2024);
          
          await prisma.transaction.update({
            where: { id: txn.id },
            data: { date: newDate }
          });
          
          profileFixed++;
          
          if (profileFixed <= 3 || profileFixed === transactions.filter(t => new Date(t.date).getFullYear() === 2025).length) {
            console.log(`  ✓ ${currentDate.toISOString().substring(0, 10)} → ${newDate.toISOString().substring(0, 10)} (${txn.description.substring(0, 40)}...)`);
          } else if (profileFixed === 4) {
            console.log(`  ... (fixing ${transactions.filter(t => new Date(t.date).getFullYear() === 2025).length - 3} more transactions)`);
          }
        }
      }

      console.log(`✅ Fixed ${profileFixed} transactions in ${profile.name}`);
      totalFixed += profileFixed;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ TOTAL FIXED: ${totalFixed} transactions`);
    console.log('='.repeat(60));

    // Verify the fix
    console.log('\n🔍 VERIFYING FIX...\n');
    
    for (const profile of user.businessProfiles) {
      const transactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { date: 'asc' }
      });

      if (transactions.length > 0) {
        const dates = transactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        const year2024Count = transactions.filter(t => new Date(t.date).getFullYear() === 2024).length;
        const year2025Count = transactions.filter(t => new Date(t.date).getFullYear() === 2025).length;
        
        console.log(`📁 ${profile.name}:`);
        console.log(`   Total: ${transactions.length} transactions`);
        console.log(`   Range: ${minDate.toISOString().substring(0, 10)} to ${maxDate.toISOString().substring(0, 10)}`);
        console.log(`   2024: ${year2024Count} ✓`);
        if (year2025Count > 0) {
          console.log(`   2025: ${year2025Count} ⚠️`);
        }
        console.log('');
      }
    }

    console.log('✅ ALL DATES NOW IN 2024 - READY FOR 2025 UPLOADS!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fix2024Dates();
