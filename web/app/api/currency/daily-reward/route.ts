import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyService } from '@/lib/currency/currency-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const currencyService = getCurrencyService()
    const result = await currencyService.claimDailyLoginReward(userId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error claiming daily reward:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

