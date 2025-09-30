
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

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
    const sourceType = searchParams.get('sourceType') as 'BANK' | 'CREDIT_CARD' | null;
    const status = searchParams.get('status') as string | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id
    };

    if (sourceType) {
      where.sourceType = sourceType;
    }

    if (status) {
      where.status = status;
    }

    const statements = await prisma.bankStatement.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    const total = await prisma.bankStatement.count({ where });

    return NextResponse.json({
      success: true,
      data: statements.map(statement => ({
        id: statement.id,
        fileName: statement.originalName,
        sourceType: statement.sourceType,
        bankName: statement.bankName,
        accountType: statement.accountType,
        fileType: statement.fileType,
        fileSize: statement.fileSize,
        status: statement.status,
        processingStage: statement.processingStage,
        recordCount: statement.recordCount,
        processedCount: statement.processedCount,
        transactionCount: statement._count.transactions,
        aiAnalysis: statement.aiAnalysis,
        createdAt: statement.createdAt,
        updatedAt: statement.updatedAt
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('LIST API ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'INTERNAL SERVER ERROR' },
      { status: 500 }
    );
  }
}
