const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function checkProfiles() {
  try {
    console.log('=== CHECKING PROFILES AND STATEMENTS ===\n');
    
    // Get all profiles
    const profiles = await prisma.profile.findMany({
      include: {
        statements: {
          include: {
            transactions: true
          }
        }
      }
    });
    
    console.log(`Found ${profiles.length} profiles:\n`);
    
    for (const profile of profiles) {
      console.log(`Profile: ${profile.name} (${profile.type})`);
      console.log(`  ID: ${profile.id}`);
      console.log(`  Statements: ${profile.statements.length}`);
      
      for (const statement of profile.statements) {
        console.log(`    - ${statement.file_name} (Status: ${statement.status})`);
        console.log(`      Transactions: ${statement.transactions.length}`);
        console.log(`      Period: ${statement.statement_date}`);
      }
      console.log('');
    }
    
    // Check if statements are properly assigned
    const personalStatement = await prisma.statement.findFirst({
      where: {
        file_name: {
          contains: 'Personal'
        }
      },
      include: {
        profile: true,
        transactions: true
      }
    });
    
    const businessStatement = await prisma.statement.findFirst({
      where: {
        file_name: {
          contains: 'Business'
        }
      },
      include: {
        profile: true,
        transactions: true
      }
    });
    
    console.log('=== STATEMENT ASSIGNMENTS ===\n');
    
    if (personalStatement) {
      console.log(`Personal Statement: ${personalStatement.file_name}`);
      console.log(`  Assigned to: ${personalStatement.profile.name} (${personalStatement.profile.type})`);
      console.log(`  Transactions: ${personalStatement.transactions.length}`);
    } else {
      console.log('Personal Statement: NOT FOUND');
    }
    
    console.log('');
    
    if (businessStatement) {
      console.log(`Business Statement: ${businessStatement.file_name}`);
      console.log(`  Assigned to: ${businessStatement.profile.name} (${businessStatement.profile.type})`);
      console.log(`  Transactions: ${businessStatement.transactions.length}`);
    } else {
      console.log('Business Statement: NOT FOUND');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfiles();
