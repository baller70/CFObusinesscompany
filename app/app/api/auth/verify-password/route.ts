
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { password: true }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found or password not set' }, { status: 404 })
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    // Generate a temporary verification token (valid for 5 minutes)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store verification token in session or return it
    return NextResponse.json({ 
      verified: true,
      token,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
