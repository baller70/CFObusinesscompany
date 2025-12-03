
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

    const { strategy = 'AVALANCHE', extraMonthlyPayment = 0 } = await request.json()
    
    // Get user's debts
    const debts = await CFOAIService.getUserDebts(session.user.id)
    
    if (debts.length === 0) {
      return NextResponse.json({
        message: 'No active debts found. Congratulations on being debt-free!',
        plan: null
      })
    }

    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0)
    const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)
    const totalMonthlyPayment = totalMinimumPayments + extraMonthlyPayment

    // Calculate debt payoff order
    const debtOrder = CFOAIService.calculateDebtPayoffOrder(debts, strategy)

    // Generate detailed plan using AI
    const prompt = `You are a debt reduction specialist. Create a detailed debt reduction plan based on the following information:

Strategy: ${strategy}
Total Debt: $${totalDebt.toLocaleString()}
Total Monthly Payment Available: $${totalMonthlyPayment.toLocaleString()}
Extra Monthly Payment: $${extraMonthlyPayment.toLocaleString()}

Debts (in payoff order):
${debtOrder.map((debt, i) => 
  `${i + 1}. ${debt.debtName}: $${debt.balance.toLocaleString()} at ${debt.interestRate}% APR (Min payment: $${debt.minimumPayment.toLocaleString()})`
).join('\n')}

Calculate and provide:
1. Total payoff timeline
2. Total interest savings compared to minimum payments
3. Monthly milestones for first 12 months
4. Key strategic recommendations

Respond in JSON format:
{
  "payoffTimelineMonths": 24,
  "totalInterestSaved": 5000,
  "recommendedStrategy": "AVALANCHE|SNOWBALL|HYBRID",
  "milestones": [
    {
      "month": 1,
      "description": "Pay off Credit Card A",
      "remainingDebt": 15000
    }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "monthlyBreakdown": [
    {
      "month": 1,
      "totalPayment": 800,
      "interestPaid": 200,
      "principalPaid": 600,
      "remainingDebt": 14400
    }
  ]
}

Respond with raw JSON only.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`)
    }

    const data = await response.json()
    const planDetails = JSON.parse(data.choices[0].message.content)

    const debtReductionPlan = {
      id: `plan_${Date.now()}`,
      strategy,
      totalDebt,
      monthlyPayment: totalMonthlyPayment,
      payoffTimeline: planDetails.payoffTimelineMonths,
      totalInterestSaved: planDetails.totalInterestSaved,
      debtOrder,
      milestones: planDetails.milestones || [],
      recommendations: planDetails.recommendations || [],
      monthlyBreakdown: planDetails.monthlyBreakdown || []
    }

    return NextResponse.json(debtReductionPlan)

  } catch (error) {
    console.error('Debt Reduction Plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate debt reduction plan' },
      { status: 500 }
    )
  }
}
