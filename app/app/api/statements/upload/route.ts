
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parsePNCStatement } from '@/lib/pdf-parser';
import { prisma } from '@/lib/db';

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse the PDF statement
    const parsedStatement = await parsePNCStatement(buffer);

    // Store parsed statement in database for review
    const statementRecord = await prisma.bankStatement.create({
      data: {
        userId: user.id,
        businessProfileId: businessProfileId || null,
        fileName: file.name,
        statementType: parsedStatement.statementType,
        accountNumber: parsedStatement.accountNumber,
        accountName: parsedStatement.accountName,
        periodStart: new Date(parsedStatement.periodStart),
        periodEnd: new Date(parsedStatement.periodEnd),
        beginningBalance: parsedStatement.beginningBalance,
        endingBalance: parsedStatement.endingBalance,
        transactionCount: parsedStatement.transactions.length,
        status: 'PENDING',
        parsedData: parsedStatement as any,
      },
    });

    return NextResponse.json({
      success: true,
      statementId: statementRecord.id,
      statement: {
        ...parsedStatement,
        transactionCount: parsedStatement.transactions.length,
      },
    });
  } catch (error: any) {
    console.error('Error uploading statement:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process statement' },
      { status: 500 }
    );
  }
}
