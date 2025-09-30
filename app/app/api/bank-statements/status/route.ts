
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statementId = searchParams.get('id');

    if (statementId) {
      // Get specific statement status
      const statement = await prisma.bankStatement.findUnique({
        where: {
          id: statementId,
          userId: session.user.id
        },
        include: {
          transactions: {
            take: 10,
            orderBy: { date: 'desc' }
          }
        }
      });

      if (!statement) {
        return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
      }

      return NextResponse.json(statement);
    } else {
      // Get all statements for user
      const statements = await prisma.bankStatement.findMany({
        where: {
          userId: session.user.id
        },
        include: {
          transactions: {
            select: { id: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const statementsWithCounts = statements.map(statement => ({
        ...statement,
        transactionCount: statement.transactions.length,
        transactions: undefined
      }));

      return NextResponse.json(statementsWithCounts);
    }

  } catch (error) {
    console.error('Status route error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
