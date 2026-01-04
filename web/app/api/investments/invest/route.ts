import { NextRequest, NextResponse } from 'next/server'
import { getInvestmentService } from '@/lib/investing/investment-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, postId, amount } = body

    if (!userId || !postId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    const investmentService = getInvestmentService()
    const result = await investmentService.investInPost(userId, postId, amount)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to invest' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      investmentId: result.investmentId
    })
  } catch (error: any) {
    console.error('Error investing:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}



