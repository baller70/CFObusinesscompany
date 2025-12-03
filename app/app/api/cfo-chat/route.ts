
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CFOAIService } from '@/lib/cfo-ai-service'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, conversationHistory = [] } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get current financial context
    const financialContext = await CFOAIService.getFinancialContext(session.user.id)

    // Build conversation context
    const systemPrompt = `You are a world-class Chief Financial Officer with 20+ years of experience. You are specifically focused on helping companies get OUT OF DEBT and achieve financial stability.

Current Financial Situation:
- Total Revenue: $${financialContext.totalRevenue?.toLocaleString() || 0}
- Total Expenses: $${financialContext.totalExpenses?.toLocaleString() || 0}
- Net Income: $${financialContext.netIncome?.toLocaleString() || 0}
- Total Debt: $${financialContext.totalDebt?.toLocaleString() || 0}
- Monthly Cash Flow: $${financialContext.cashFlow?.toLocaleString() || 0}
- Debt-to-Income Ratio: ${financialContext.debtToIncomeRatio ? (financialContext.debtToIncomeRatio * 100).toFixed(1) + '%' : 'N/A'}
- Profit Margin: ${financialContext.profitMargin?.toFixed(1)}%

Your responses should be:
1. Actionable and specific
2. Focused on debt reduction and financial stability
3. Based on real financial data
4. Professional but accessible
5. Include specific numbers and timelines when possible

Always prioritize getting this company out of debt while maintaining operational stability.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ]

    // Stream response from LLM
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`)
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        
        try {
          while (true) {
            const { done, value } = await reader!.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('CFO Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process CFO chat message' },
      { status: 500 }
    )
  }
}
