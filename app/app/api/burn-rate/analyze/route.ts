
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { businessProfileId } = await request.json()

    // Fetch all financial data
    const [bankAccounts, creditCards, loans, homeEquity, lineOfCredit, transactions] = await Promise.all([
      prisma.bankAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
      }),
      prisma.creditCardAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
      }),
      prisma.loanAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
      }),
      prisma.homeEquityAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
      }),
      prisma.lineOfCreditAccount.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          isActive: true,
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId: user.id,
          ...(businessProfileId && { businessProfileId }),
          date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 3)),
          },
        },
      }),
    ])

    // Calculate financial metrics
    const totalCash = bankAccounts.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
    const totalCreditLimit = creditCards.reduce((sum: number, acc: any) => sum + acc.creditLimit, 0) +
                             lineOfCredit.reduce((sum: number, acc: any) => sum + acc.creditLimit, 0)
    const totalCreditUsed = creditCards.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0) +
                           lineOfCredit.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
    const totalCreditAvailable = totalCreditLimit - totalCreditUsed
    const totalLoans = loans.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
    const totalHomeEquity = homeEquity.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
    const totalDebt = totalCreditUsed + totalLoans + totalHomeEquity

    // Calculate monthly expenses and revenue (average from last 3 months)
    const expenses = transactions.filter((t: any) => t.type === 'EXPENSE')
    const revenue = transactions.filter((t: any) => t.type === 'INCOME')
    const monthlyExpenses = expenses.reduce((sum: number, t: any) => sum + t.amount, 0) / 3
    const monthlyRevenue = revenue.reduce((sum: number, t: any) => sum + t.amount, 0) / 3

    // Calculate burn rate and runway
    const burnRate = monthlyExpenses - monthlyRevenue
    const runwayMonths = burnRate > 0 ? totalCash / burnRate : null

    // Prepare data for AI analysis
    const financialData = {
      totalCash,
      totalCreditLimit,
      totalCreditAvailable,
      totalDebt,
      monthlyExpenses,
      monthlyRevenue,
      burnRate,
      runwayMonths,
      accounts: {
        bankAccounts: bankAccounts.length,
        creditCards: creditCards.length,
        loans: loans.length,
        homeEquity: homeEquity.length,
        lineOfCredit: lineOfCredit.length,
      },
      loanDetails: loans.map((l: any) => ({
        name: l.loanName,
        balance: l.currentBalance,
        monthlyPayment: l.monthlyPayment,
        interestRate: l.interestRate,
      })),
    }

    // Call AI API for analysis and recommendations
    const messages = [
      {
        role: 'system',
        content: `You are a CFO financial advisor AI. Analyze the provided financial data and provide strategic recommendations to help the business maintain financial health and avoid cash flow issues. Focus on actionable advice.`
      },
      {
        role: 'user',
        content: `Analyze this financial situation and provide recommendations:

Financial Data:
- Total Cash: $${totalCash.toFixed(2)}
- Total Credit Available: $${totalCreditAvailable.toFixed(2)} (Limit: $${totalCreditLimit.toFixed(2)})
- Total Debt: $${totalDebt.toFixed(2)}
- Monthly Expenses: $${monthlyExpenses.toFixed(2)}
- Monthly Revenue: $${monthlyRevenue.toFixed(2)}
- Monthly Burn Rate: $${burnRate.toFixed(2)}
${runwayMonths ? `- Runway: ${runwayMonths.toFixed(1)} months` : '- Runway: Positive cash flow'}

Loan Details:
${loans.map((l: any) => `- ${l.loanName}: $${l.currentBalance.toFixed(2)} balance, $${l.monthlyPayment.toFixed(2)}/mo at ${l.interestRate}% APR`).join('\n')}

Please respond in JSON format with the following structure:
{
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Brief 2-3 sentence overview of financial health",
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed explanation",
      "priority": "HIGH|MEDIUM|LOW",
      "impact": "Expected financial impact",
      "category": "CASH_FLOW|DEBT|REVENUE|EXPENSES|CREDIT"
    }
  ],
  "actionItems": [
    {
      "action": "Specific action to take",
      "timeline": "When to do it",
      "expectedOutcome": "What to expect"
    }
  ],
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ]
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
      }
    ]

    const aiResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    })

    if (!aiResponse.ok) {
      throw new Error('Failed to get AI recommendations')
    }

    const aiData = await aiResponse.json()
    const analysis = JSON.parse(aiData.choices[0].message.content)

    // Save analysis to database
    const burnRateAnalysis = await prisma.burnRateAnalysis.create({
      data: {
        userId: user.id,
        businessProfileId,
        totalCash,
        totalCredit: totalCreditAvailable,
        totalDebt,
        monthlyExpenses,
        monthlyRevenue,
        burnRate,
        runwayMonths,
        riskLevel: analysis.riskLevel,
        recommendations: analysis,
        actionItems: analysis.actionItems,
      },
    })

    return NextResponse.json({
      ...financialData,
      analysis: {
        ...analysis,
        id: burnRateAnalysis.id,
        analysisDate: burnRateAnalysis.analysisDate,
      },
    })
  } catch (error) {
    console.error('Error analyzing burn rate:', error)
    return NextResponse.json({ error: 'Failed to analyze burn rate' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const businessProfileId = request.nextUrl.searchParams.get('businessProfileId')

    // Get the latest analysis
    const latestAnalysis = await prisma.burnRateAnalysis.findFirst({
      where: {
        userId: user.id,
        ...(businessProfileId && { businessProfileId }),
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestAnalysis) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 })
    }

    return NextResponse.json(latestAnalysis)
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }
}
