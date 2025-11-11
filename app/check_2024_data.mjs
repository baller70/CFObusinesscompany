import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function check2024Data() {
  try {
    console.log('\n🔍 CHECKING 2024 DATA STATUS\n');
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

    console.log(`\n👤 User: ${user.email}`);
    console.log(`📊 Business Profiles: ${user.businessProfiles.length}`);

    for (const profile of user.businessProfiles) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📁 Profile: ${profile.name} (${profile.type})`);
      console.log(`${'='.repeat(60)}`);

      // Get all statements for this profile
      const statements = await prisma.bankStatement.findMany({
        where: { 
          businessProfileId: profile.id 
        },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`\n📄 Bank Statements: ${statements.length}`);
      
      for (const stmt of statements) {
        console.log(`\n  Statement ID: ${stmt.id}`);
        console.log(`  File: ${stmt.fileName}`);
        console.log(`  Period: ${stmt.statementPeriod || 'Not specified'}`);
        console.log(`  Created: ${stmt.createdAt.toISOString().split('T')[0]}`);
        console.log(`  Status: ${stmt.status}`);
        
        // Get transactions for this statement
        const transactions = await prisma.transaction.findMany({
          where: { bankStatementId: stmt.id },
          orderBy: { date: 'asc' }
        });

        if (transactions.length > 0) {
          const dates = transactions.map(t => new Date(t.date));
          const minDate = new Date(Math.min(...dates));
          const maxDate = new Date(Math.max(...dates));
          
          console.log(`  Transactions: ${transactions.length}`);
          console.log(`  Date Range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
          
          // Check if any transactions are from 2025
          const year2025Count = transactions.filter(t => {
            const year = new Date(t.date).getFullYear();
            return year === 2025;
          }).length;
          
          const year2024Count = transactions.filter(t => {
            const year = new Date(t.date).getFullYear();
            return year === 2024;
          }).length;

          const otherYearsCount = transactions.length - year2024Count - year2025Count;
          
          console.log(`  📅 2024 Transactions: ${year2024Count}`);
          if (year2025Count > 0) {
            console.log(`  ⚠️  2025 Transactions: ${year2025Count} (UNEXPECTED!)`);
          }
          if (otherYearsCount > 0) {
            console.log(`  ⚠️  Other Years: ${otherYearsCount}`);
          }
        }
      }

      // Get all transactions for profile (not statement-specific)
      const allTransactions = await prisma.transaction.findMany({
        where: { businessProfileId: profile.id },
        orderBy: { date: 'asc' }
      });

      if (allTransactions.length > 0) {
        console.log(`\n📊 Total Transactions in Profile: ${allTransactions.length}`);
        
        const dates = allTransactions.map(t => new Date(t.date));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        console.log(`📅 Overall Date Range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);
        
        // Year breakdown
        const yearBreakdown = {};
        allTransactions.forEach(t => {
          const year = new Date(t.date).getFullYear();
          yearBreakdown[year] = (yearBreakdown[year] || 0) + 1;
        });
        
        console.log('\n📊 Transactions by Year:');
        Object.entries(yearBreakdown).sort().forEach(([year, count]) => {
          console.log(`  ${year}: ${count} transactions`);
        });

        // Month breakdown for 2024
        const month2024Breakdown = {};
        allTransactions
          .filter(t => new Date(t.date).getFullYear() === 2024)
          .forEach(t => {
            const month = new Date(t.date).toISOString().substring(0, 7); // YYYY-MM
            month2024Breakdown[month] = (month2024Breakdown[month] || 0) + 1;
          });
        
        if (Object.keys(month2024Breakdown).length > 0) {
          console.log('\n📅 2024 Transactions by Month:');
          Object.entries(month2024Breakdown).sort().forEach(([month, count]) => {
            console.log(`  ${month}: ${count} transactions`);
          });
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DATA CHECK COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check2024Data();
