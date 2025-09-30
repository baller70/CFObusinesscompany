
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json(
        { success: false, message: 'STATEMENT ID REQUIRED' },
        { status: 400 }
      );
    }

    const statement = await prisma.bankStatement.findFirst({
      where: {
        id: statementId,
        userId: session.user.id
      }
    });

    if (!statement) {
      return NextResponse.json(
        { success: false, message: 'STATEMENT NOT FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: statement.id,
      fileName: statement.originalName,
      sourceType: statement.sourceType,
      status: statement.status,
      processingStage: statement.processingStage,
      recordCount: statement.recordCount,
      processedCount: statement.processedCount,
      errorLog: statement.errorLog,
      aiAnalysis: statement.aiAnalysis,
      createdAt: statement.createdAt,
      updatedAt: statement.updatedAt
    });

  } catch (error) {
    console.error('STATUS API ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}
