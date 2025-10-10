const { PrismaClient } = require('@prisma/client');

async function checkUploadErrors() {
  const prisma = new PrismaClient();
  
  try {
    const recentUploads = await prisma.bankStatementUpload.findMany({
      where: {
        user: {
          email: 'khouston721@gmail.com'
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      take: 10
    });

    console.log('\n=== RECENT UPLOADS ===\n');
    
    if (recentUploads.length === 0) {
      console.log('No uploads found.');
    } else {
      recentUploads.forEach(upload => {
        console.log(`File: ${upload.fileName}`);
        console.log(`Status: ${upload.status}`);
        console.log(`Processing Stage: ${upload.processingStage}`);
        console.log(`Uploaded: ${upload.uploadedAt}`);
        if (upload.errorLog) {
          console.log(`ERROR: ${upload.errorLog}`);
        }
        console.log('---');
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUploadErrors();
