
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Fetch merchant rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessProfileId = searchParams.get('businessProfileId');

    const whereClause: any = {
      userId: session.user.id
    };

    if (businessProfileId) {
      whereClause.businessProfileId = businessProfileId;
    }

    const rules = await prisma.merchantRule.findMany({
      where: whereClause,
      include: {
        businessProfile: true
      },
      orderBy: [
        { priority: 'desc' },
        { appliedCount: 'desc' }
      ]
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Merchant rules fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch merchant rules' },
      { status: 500 }
    );
  }
}

// POST - Create a new merchant rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      merchantName,
      merchantPattern,
      suggestedCategory,
      profileType,
      businessProfileId,
      priority,
      autoApply
    } = body;

    if (!merchantName || !suggestedCategory || !profileType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if rule already exists
    const existingRule = await prisma.merchantRule.findFirst({
      where: {
        userId: session.user.id,
        merchantName: {
          equals: merchantName,
          mode: 'insensitive'
        }
      }
    });

    if (existingRule) {
      return NextResponse.json(
        { error: 'A rule for this merchant already exists' },
        { status: 400 }
      );
    }

    const rule = await prisma.merchantRule.create({
      data: {
        userId: session.user.id,
        businessProfileId,
        merchantName,
        merchantPattern,
        suggestedCategory,
        profileType,
        priority: priority || 50,
        autoApply: autoApply !== undefined ? autoApply : true
      }
    });

    return NextResponse.json({
      success: true,
      rule,
      message: 'Merchant rule created successfully'
    });
  } catch (error) {
    console.error('Merchant rule creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create merchant rule' },
      { status: 500 }
    );
  }
}

// PUT - Update a merchant rule
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ruleId, updates } = body;

    const rule = await prisma.merchantRule.findUnique({
      where: { id: ruleId }
    });

    if (!rule || rule.userId !== session.user.id) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const updatedRule = await prisma.merchantRule.update({
      where: { id: ruleId },
      data: updates
    });

    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: 'Merchant rule updated successfully'
    });
  } catch (error) {
    console.error('Merchant rule update error:', error);
    return NextResponse.json(
      { error: 'Failed to update merchant rule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a merchant rule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }

    const rule = await prisma.merchantRule.findUnique({
      where: { id: ruleId }
    });

    if (!rule || rule.userId !== session.user.id) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    await prisma.merchantRule.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Merchant rule deleted successfully'
    });
  } catch (error) {
    console.error('Merchant rule deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete merchant rule' },
      { status: 500 }
    );
  }
}
