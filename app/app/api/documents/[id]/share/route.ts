
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

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

    // Generate secure share token
    const shareToken = randomBytes(32).toString('hex')

    // Parse expiration date if provided
    let expiresAt: Date | null = null
    if (body.expiresIn) {
      const now = new Date()
      switch (body.expiresIn) {
        case '1hour':
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
          break
        case '24hours':
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          break
        case '7days':
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          break
      }
    }

    // Create share link
    const share = await prisma.documentShare.create({
      data: {
        documentId,
        sharedBy: session.user.id,
        sharedWith: body.sharedWith || null,
        shareToken,
        expiresAt,
        maxDownloads: body.maxDownloads || null
      }
    })

    const shareUrl = `${process.env.NEXTAUTH_URL}/shared/${shareToken}`

    return NextResponse.json({ 
      success: true,
      share: {
        ...share,
        shareUrl
      }
    })
  } catch (error) {
    console.error('Error creating share:', error)
    return NextResponse.json(
      { error: 'Failed to create share link' },
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

    // Fetch all shares for this document
    const shares = await prisma.documentShare.findMany({
      where: {
        documentId,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const sharesWithUrl = shares.map(share => ({
      ...share,
      shareUrl: `${process.env.NEXTAUTH_URL}/shared/${share.shareToken}`
    }))

    return NextResponse.json({ 
      success: true,
      shares: sharesWithUrl
    })
  } catch (error) {
    console.error('Error fetching shares:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 }
    )
  }
}
