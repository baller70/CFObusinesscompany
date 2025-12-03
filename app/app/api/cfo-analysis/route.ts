
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CFOAIService } from '@/lib/cfo-ai-service'
import { CFOAnalysisType } from '@/lib/types'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Safely parse JSON body - handle empty or invalid JSON
    let body: { analysisType?: string } = {}
    try {
      const text = await request.text()
      if (text && text.trim()) {
        body = JSON.parse(text)
      }
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { analysisType } = body

    if (!analysisType) {
      return NextResponse.json({ error: 'Analysis type is required' }, { status: 400 })
    }

    // Get financial context
    const financialContext = await CFOAIService.getFinancialContext(session.user.id)
    
    // Generate analysis prompt
    const prompt = CFOAIService.buildAnalysisPrompt(analysisType as CFOAnalysisType, financialContext)

    // Call LLM API
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`)
    }

    const data = await response.json()
    const analysisResult = JSON.parse(data.choices[0].message.content)

    return NextResponse.json({
      ...analysisResult,
      financialContext,
      analysisType
    })

  } catch (error) {
    console.error('CFO Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to generate CFO analysis' },
      { status: 500 }
    )
  }
}
