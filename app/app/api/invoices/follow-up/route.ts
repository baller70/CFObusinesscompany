
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId, customerEmail } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Simulate sending follow-up email
    console.log('Sending follow-up for invoice:', invoiceId, 'to:', customerEmail)

    // In a real application, you would:
    // 1. Get invoice details
    // 2. Send follow-up email with payment reminder
    // 3. Log the follow-up activity
    // 4. Possibly escalate if multiple follow-ups

    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ 
      success: true, 
      message: 'Follow-up reminder sent successfully',
      invoiceId,
      sentTo: customerEmail,
      sentAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending follow-up:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
