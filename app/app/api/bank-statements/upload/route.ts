
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import { queueManager } from '@/lib/queue-manager';
import { getCurrentBusinessProfileId } from '@/lib/business-profile-utils';

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

    // Get current business profile ID (respects profile switcher)
    const businessProfileId = await getCurrentBusinessProfileId();
    
    if (!businessProfileId) {
      return NextResponse.json({ error: 'No active business profile found' }, { status: 400 });
    }
    
    const sourceTypes = formData.getAll('sourceTypes') as string[];

    const uploadResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
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

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        uploadResults.push({
          fileName: file.name,
          error: 'File size exceeds 50MB limit.'
        });
        continue;
      }

      try {
        // Upload file to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const cloudStoragePath = await uploadFile(buffer, file.name, file.type);

        // Determine file type
        const fileType = fileExtension === '.pdf' ? 'PDF' : 'CSV';
        
        // Determine source type (BANK or CREDIT_CARD)
        const sourceType = sourceTypes[i] || 'BANK';

        // Create database record
        const bankStatement = await prisma.bankStatement.create({
          data: {
            userId: session.user.id,
            businessProfileId: businessProfileId,
            fileName: file.name,
            originalName: file.name,
            cloudStoragePath,
            fileType: fileType as any,
            fileSize: file.size,
            sourceType: sourceType as any,
            status: 'PENDING',
            processingStage: 'UPLOADED'
          }
        });

        uploadResults.push({
          id: bankStatement.id,
          fileName: file.name,
          fileType,
          status: 'queued',
          size: file.size
        });

        // Add to processing queue instead of immediate processing
        queueManager.addToQueue(bankStatement.id).catch(error => {
          console.error(`Failed to add ${file.name} to queue:`, error);
        });

      } catch (error) {
        console.error('Upload error:', error);
        uploadResults.push({
          fileName: file.name,
          error: 'Upload failed. Please try again.'
        });
      }
    }

    const queueStatus = queueManager.getQueueStatus();
    
    return NextResponse.json({ 
      success: true,
      uploads: uploadResults,
      message: `${uploadResults.filter(r => !r.error).length} files uploaded and queued for processing`,
      queueStatus: {
        active: queueStatus.active,
        maxConcurrent: queueStatus.max
      }
    });

  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
