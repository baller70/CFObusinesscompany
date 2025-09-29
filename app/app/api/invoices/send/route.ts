
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId, to, subject, message } = await req.json()

    if (!invoiceId || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Simulate sending invoice email
    console.log('Sending invoice email:', { invoiceId, to, subject, message })

    // In a real application, you would:
    // 1. Update invoice status to SENT
    // 2. Send actual email using a service like SendGrid, AWS SES, etc.
    // 3. Log the activity
    // 4. Possibly schedule follow-up reminders

    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({ 
      success: true, 
      message: 'Invoice sent successfully',
      sentTo: to,
      sentAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error sending invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
