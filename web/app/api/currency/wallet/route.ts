import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyService } from '@/lib/currency/currency-service'

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

    const currencyService = getCurrencyService()
    const wallet = await currencyService.getOrCreateWallet(userId)
    const stats = await currencyService.getCurrencyStats(userId)

    return NextResponse.json({
      wallet,
      stats
    })
  } catch (error: any) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


