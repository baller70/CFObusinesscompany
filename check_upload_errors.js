const { PrismaClient } = require('@prisma/client');

async function checkUploadErrors() {
  const prisma = new PrismaClient();
  
  try {
    // Get the most recent bank statement uploads with errors
    const recentUploads = await prisma.bankStatementUpload.findMany({
      where: {
        user: {
          email: 'khouston721@gmail.com'
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      },
      take: 10,
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    console.log('\n=== RECENT UPLOADS ===\n');
    recentUploads.forEach(upload => {
      console.log(`File: ${upload.fileName}`);
      console.log(`Status: ${upload.status}`);
      console.log(`Processing Stage: ${upload.processingStage}`);
      console.log(`Uploaded: ${upload.uploadedAt}`);
      if (upload.errorLog) {
        console.log(`❌ ERROR: ${upload.errorLog}`);
      }
      console.log(`File Path: ${upload.filePath}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking uploads:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUploadErrors();
