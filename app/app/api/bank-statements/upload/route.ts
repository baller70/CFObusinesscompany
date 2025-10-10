
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadResults = [];

    for (const file of files) {
      // Validate file type
      const allowedTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
      const allowedExtensions = ['.csv', '.pdf', '.xls', '.xlsx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        uploadResults.push({
          fileName: file.name,
          error: 'Invalid file type. Only CSV and PDF files are supported.'
        });
        continue;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        uploadResults.push({
          fileName: file.name,
          error: 'File size exceeds 10MB limit.'
        });
        continue;
      }

      try {
        // Upload file to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const cloudStoragePath = await uploadFile(buffer, file.name, file.type);

        // Determine file type
        const fileType = fileExtension === '.pdf' ? 'PDF' : 'CSV';

        // Create database record
        const bankStatement = await prisma.bankStatement.create({
          data: {
            userId: session.user.id,
            fileName: file.name,
            originalName: file.name,
            cloudStoragePath,
            fileType: fileType as any,
            fileSize: file.size,
            status: 'PENDING',
            processingStage: 'UPLOADED'
          }
        });

        uploadResults.push({
          id: bankStatement.id,
          fileName: file.name,
          fileType,
          status: 'uploaded',
          size: file.size
        });

        // Start processing asynchronously
        processStatementAsync(bankStatement.id);

      } catch (error) {
        console.error('Upload error:', error);
        uploadResults.push({
          fileName: file.name,
          error: 'Upload failed. Please try again.'
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      uploads: uploadResults,
      message: `${uploadResults.filter(r => !r.error).length} files uploaded successfully`
    });

  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

// Async processing function
async function processStatementAsync(statementId: string) {
  // Process in background without blocking the upload response
  setImmediate(async () => {
    try {
      // Import the processor dynamically to avoid circular dependencies
      const { processStatement } = await import('@/lib/statement-processor');
      await processStatement(statementId);
    } catch (error) {
      console.error('Async processing failed:', error);
      
      // Update status to failed
      await prisma.bankStatement.update({
        where: { id: statementId },
        data: {
          status: 'FAILED',
          processingStage: 'FAILED',
          errorLog: error instanceof Error ? error.message : 'Processing failed'
        }
      }).catch(console.error);
    }
  });
}
