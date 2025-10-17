
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";

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
    const status = searchParams.get('status');

    const where: any = {
      userId: session.user.id
    };

    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: {
          dueDate: 'asc'
        },
        take: limit,
        skip: offset,
        include: {
          project: true,
          contractor: true
        }
      }),
      prisma.task.count({ where })
    ]);

    return NextResponse.json({
      tasks,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error("Get tasks error:", error);
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

    const body = await request.json();
    const { 
      title, 
      description, 
      priority, 
      status, 
      dueDate, 
      estimatedHours,
      projectId,
      contractorId
    } = body;

    if (!title || !priority || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, priority, and dueDate" },
        { status: 400 }
      );
    }

    // Map priority values from form to database enum
    const priorityMap: any = {
      'low': 'LOW',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'URGENT'
    };

    // Map status values from form to database enum
    const statusMap: any = {
      'todo': 'TODO',
      'in-progress': 'IN_PROGRESS',
      'review': 'REVIEW',
      'completed': 'COMPLETED'
    };

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priorityMap[priority.toLowerCase()] || priority,
        status: statusMap[status?.toLowerCase()] || 'TODO',
        dueDate: new Date(dueDate),
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        projectId: projectId || null,
        contractorId: contractorId || null
      },
      include: {
        project: true,
        contractor: true
      }
    });

    return NextResponse.json(task, { status: 201 });

  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
