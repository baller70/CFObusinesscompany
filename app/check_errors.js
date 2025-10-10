require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function checkErrors() {
  const prisma = new PrismaClient();
  
  try {
    const recentUploads = await prisma.bankStatement.findMany({
      where: {
        user: {
          email: 'khouston721@gmail.com'
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('\n=== RECENT STATEMENT UPLOADS ===\n');
    
    if (recentUploads.length === 0) {
      console.log('No uploads found for khouston721@gmail.com');
    } else {
      recentUploads.forEach(upload => {
        console.log(`ID: ${upload.id}`);
        console.log(`File: ${upload.fileName}`);
        console.log(`Original Name: ${upload.originalName || 'N/A'}`);
        console.log(`Status: ${upload.status}`);
        console.log(`Processing Stage: ${upload.processingStage}`);
        console.log(`Source Type: ${upload.sourceType}`);
        console.log(`Created: ${upload.createdAt}`);
        console.log(`Processed: ${upload.processedAt || 'Not yet'}`);
        if (upload.errorLog) {
          console.log(`\n❌ ERROR LOG:\n${upload.errorLog}\n`);
        }
        console.log('---\n');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkErrors();
