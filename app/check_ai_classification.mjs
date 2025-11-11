import { config } from 'dotenv';
config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAI() {
  try {
    // Get some transactions and check if they have AI metadata
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: (await prisma.user.findUnique({
          where: { email: 'khouston@thebasketballfactorynj.com' }
        })).id
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        description: true,
        amount: true,
        category: true,
        type: true,
        businessProfileId: true,
        metadata: true,
        aiCategorized: true,
        confidence: true
      }
    });

    console.log('\n=== AI CLASSIFICATION CHECK ===\n');
    
    transactions.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.description}`);
      console.log(`   Amount: $${t.amount} | Category: ${t.category}`);
      console.log(`   AI Categorized: ${t.aiCategorized}`);
      console.log(`   Confidence: ${t.confidence}`);
      console.log(`   Profile ID: ${t.businessProfileId}`);
      console.log(`   Metadata: ${JSON.stringify(t.metadata)}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAI();
