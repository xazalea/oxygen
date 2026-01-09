import { NextRequest, NextResponse } from 'next/server'
import { getInvestmentService } from '@/lib/investing/investment-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = (searchParams.get('type') || 'investors') as 'investors' | 'posts'
    const limit = parseInt(searchParams.get('limit') || '10')

    const investmentService = getInvestmentService()
    const leaderboard = await investmentService.getLeaderboard(type, limit)

    return NextResponse.json(leaderboard)
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}




