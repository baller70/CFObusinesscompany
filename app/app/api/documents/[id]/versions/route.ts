
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Fetch all versions
    const versions = await prisma.documentVersion.findMany({
      where: {
        documentId
      },
      orderBy: {
        version: 'desc'
      }
    })

    // Include current version
    const allVersions = [
      {
        id: document.id,
        documentId: document.id,
        version: document.version,
        fileName: document.fileName,
        cloudStoragePath: document.cloudStoragePath,
        fileSize: document.fileSize,
        changeDescription: 'Current version',
        createdAt: document.updatedAt,
        createdBy: session.user.id,
        isCurrent: true
      },
      ...versions.map(v => ({ ...v, isCurrent: false }))
    ]

    return NextResponse.json({ 
      success: true,
      versions: allVersions,
      currentVersion: document.version
    })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}
