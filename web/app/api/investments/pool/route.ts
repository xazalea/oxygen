import { NextRequest, NextResponse } from 'next/server'
import { getInvestmentService } from '@/lib/investing/investment-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      )
    }

    const investmentService = getInvestmentService()
    const pool = await investmentService.getOrCreatePool(postId)

    return NextResponse.json(pool)
  } catch (error: any) {
    console.error('Error fetching pool:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


