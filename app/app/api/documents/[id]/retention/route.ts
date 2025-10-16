
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.id
    const body = await request.json()

    // Verify document access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Calculate retention expiry
    let retentionExpiry: Date | null = null
    if (body.retentionPolicyEnabled && body.retentionPolicyYears) {
      const now = new Date()
      retentionExpiry = new Date(now.getFullYear() + body.retentionPolicyYears, now.getMonth(), now.getDate())
    }

    // Update document with retention policy
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        retentionPolicyEnabled: body.retentionPolicyEnabled || false,
        retentionPolicyYears: body.retentionPolicyYears || null,
        retentionExpiry,
        complianceCategory: body.complianceCategory || null
      }
    })

    return NextResponse.json({ 
      success: true,
      document: updatedDocument
    })
  } catch (error) {
    console.error('Error updating retention policy:', error)
    return NextResponse.json(
      { error: 'Failed to update retention policy' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const documentId = params.id

    // Verify document access and fetch retention policy
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id
      },
      select: {
        id: true,
        name: true,
        retentionPolicyEnabled: true,
        retentionPolicyYears: true,
        retentionExpiry: true,
        complianceCategory: true
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      retentionPolicy: document
    })
  } catch (error) {
    console.error('Error fetching retention policy:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retention policy' },
      { status: 500 }
    )
  }
}
