import { NextRequest, NextResponse } from 'next/server'
import { getInvestmentService } from '@/lib/investing/investment-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const investmentService = getInvestmentService()
    const portfolio = await investmentService.getPortfolio(userId)

    return NextResponse.json(portfolio)
  } catch (error: any) {
    console.error('Error fetching portfolio:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

