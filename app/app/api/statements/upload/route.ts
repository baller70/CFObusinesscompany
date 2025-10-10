
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { uploadFile } from '@/lib/s3';
import { processStatement } from '@/lib/statement-processor';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sourceTypes = formData.getAll('sourceTypes') as string[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'NO FILES PROVIDED' },
        { status: 400 }
      );
    }

    const uploads = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sourceType = (sourceTypes[i] || 'BANK') as 'BANK' | 'CREDIT_CARD';

      try {
        // Validate file type
        const fileType = file.type === 'application/pdf' ? 'PDF' : 'CSV';
        if (!['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(file.type)) {
          uploads.push({
            fileName: file.name,
            error: 'UNSUPPORTED FILE TYPE'
          });
          continue;
        }

        // Convert file to buffer and upload to S3
        const buffer = Buffer.from(await file.arrayBuffer());
        const s3Key = `statements/${Date.now()}-${file.name}`;
        const cloudStoragePath = await uploadFile(buffer, s3Key);

        // Create database record
        const bankStatement = await prisma.bankStatement.create({
          data: {
            userId: session.user.id,
            fileName: s3Key,
            originalName: file.name,
            cloudStoragePath,
            fileType,
            sourceType,
            fileSize: file.size,
            status: 'PENDING',
            processingStage: 'UPLOADED'
          }
        });

        uploads.push({
          id: bankStatement.id,
          fileName: file.name,
          sourceType,
          status: 'uploaded',
          message: 'STATEMENT UPLOADED SUCCESSFULLY'
        });

        // Start asynchronous processing with real AI processor
        processStatementAsync(bankStatement.id, session.user.id);

      } catch (error) {
        console.error('FILE UPLOAD ERROR:', error);
        uploads.push({
          fileName: file.name,
          error: 'UPLOAD FAILED'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${uploads.filter(u => !u.error).length} STATEMENTS UPLOADED SUCCESSFULLY`,
      uploads
    });

  } catch (error) {
    console.error('UPLOAD API ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}

async function processStatementAsync(statementId: string, userId: string) {
  try {
    // Use the real AI-powered statement processor
    await processStatement(statementId, userId);
  } catch (error) {
    console.error('PROCESSING ERROR:', error);
    // Error handling is done in processStatement
  }
}
