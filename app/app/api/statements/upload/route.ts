
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';
import { processStatement } from '@/lib/statement-processor';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businessProfiles: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const businessProfileId = formData.get('businessProfileId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

    if (!isPDF && !isCSV) {
      return NextResponse.json({ error: 'Only PDF and CSV files are supported' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file to S3
    const cloudStoragePath = await uploadFile(
      buffer, 
      file.name, 
      isPDF ? 'application/pdf' : 'text/csv'
    );

    // Create statement record in database
    const statementRecord = await prisma.bankStatement.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId || null,
        fileName: file.name,
        originalName: file.name,
        cloudStoragePath: cloudStoragePath,
        fileType: isPDF ? 'PDF' : 'CSV',
        fileSize: file.size,
        sourceType: 'BANK', // Default to bank, can be changed later
        status: 'PENDING',
        processingStage: 'UPLOADED',
      },
    });

    // Trigger background processing (non-blocking)
    processStatement(statementRecord.id, user.id).catch((error) => {
      console.error('Background processing error:', error);
    });

    return NextResponse.json({
      success: true,
      statementId: statementRecord.id,
      statement: {
        id: statementRecord.id,
        fileName: statementRecord.fileName,
        status: statementRecord.status,
        transactionCount: 0, // Will be updated after processing
      },
      message: 'Statement uploaded successfully. Processing will begin shortly.',
    });
  } catch (error: any) {
    console.error('Error uploading statement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload statement' },
      { status: 500 }
    );
  }
}
