
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { getCurrentBusinessProfileId } from "../../../lib/business-profile-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    // Get current business profile ID
    const businessProfileId = await getCurrentBusinessProfileId();

    const where: any = {
      userId: session.user.id,
      // Filter by business profile if one is selected
      ...(businessProfileId ? { businessProfileId } : {})
    };

    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: {
          date: 'desc'
        },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where })
    ]);

    return NextResponse.json({
      transactions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, amount, description, category, type, account, merchant } = await request.json();

    if (!date || amount === undefined || !description || !category || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current business profile ID
    const businessProfileId = await getCurrentBusinessProfileId();

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        businessProfileId,
        date: new Date(date),
        amount: parseFloat(amount),
        description: description.trim(),
        category: category.trim(),
        type,
        account: account?.trim() || null,
        merchant: merchant?.trim() || null,
      }
    });

    return NextResponse.json(transaction, { status: 201 });

  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
