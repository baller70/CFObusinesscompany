
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { financialData } = await request.json()

    const prompt = `You are a US tax expert with deep knowledge of the Internal Revenue Code and the US Master Tax Guide. Analyze the following personal financial data and provide comprehensive tax break recommendations.

Financial Data:
- Annual Income: $${financialData.income.toLocaleString()}
- Annual Expenses: $${financialData.expenses.toLocaleString()}
- Charitable Donations: $${financialData.charitableDonations.toLocaleString()}
- Healthcare Expenses: $${financialData.healthcareExpenses.toLocaleString()}
- Retirement Contributions: $${financialData.retirementContributions.toLocaleString()}
- Education Savings: $${financialData.educationSavings.toLocaleString()}
- Mortgage Interest: $${financialData.mortgageInterest.toLocaleString()}
- Student Loan Interest: $${financialData.studentLoanInterest.toLocaleString()}
- Filing Status: ${financialData.filingStatus}

Please provide recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "category": "Category name (e.g., 'Retirement', 'Healthcare', 'Education', 'Charitable', 'Home', 'Business')",
      "title": "Tax break title",
      "description": "Detailed description of the tax break",
      "potentialSavings": <estimated dollar amount>,
      "eligibility": "Who qualifies for this",
      "requirements": ["requirement 1", "requirement 2"],
      "ircSection": "IRC Section reference",
      "deadline": "Important deadline if applicable",
      "actionItems": ["action 1", "action 2"]
    }
  ],
  "legalLoopholes": [
    {
      "title": "Loophole title",
      "description": "How this legal strategy works",
      "potentialSavings": <estimated dollar amount>,
      "complexity": "Low/Medium/High",
      "requirements": ["requirement 1", "requirement 2"],
      "risks": ["risk 1", "risk 2"],
      "professionalAdvice": "When to consult a tax professional"
    }
  ],
  "estimatedTotalSavings": <total potential savings>,
  "priorityActions": ["Most important action 1", "Most important action 2", "Most important action 3"]
}

Focus on:
1. Standard deductions vs itemized deductions analysis
2. Retirement account optimization (Traditional IRA, Roth IRA, 401(k), HSA)
3. Healthcare deductions (premiums, unreimbursed expenses, HSA benefits)
4. Education benefits (529 plans, student loan interest, education credits)
5. Charitable giving strategies (bunching, DAF, QCD)
6. Home-related deductions (mortgage interest, property taxes, home office)
7. Legal tax minimization strategies
8. Tax credits they may qualify for

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{
          role: 'user',
          content: prompt
        }],
        stream: true,
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get AI recommendations')
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let buffer = ''
        let partialRead = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            partialRead += decoder.decode(value, { stream: true })
            let lines = partialRead.split('\n')
            partialRead = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer)
                    const finalData = JSON.stringify({
                      status: 'completed',
                      result: finalResult
                    })
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
                  } catch (e) {
                    console.error('Error parsing final result:', e)
                  }
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  buffer += parsed.choices?.[0]?.delta?.content || ''
                  const progressData = JSON.stringify({
                    status: 'processing',
                    message: 'Analyzing your financial data...'
                  })
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
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
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
