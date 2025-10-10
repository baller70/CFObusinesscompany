
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const statementId = searchParams.get('id');

    if (!statementId) {
      return NextResponse.json({ error: 'Statement ID required' }, { status: 400 });
    }

    const statement = await prisma.bankStatement.findFirst({
      where: {
        id: statementId,
        userId: user.id,
      },
      include: {
        businessProfile: true,
      },
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    return NextResponse.json({ statement });
  } catch (error) {
    console.error('Error fetching statement:', error);
    return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
  }
}
