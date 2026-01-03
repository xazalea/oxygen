import { NextRequest, NextResponse } from 'next/server'
import { getCurrencyService } from '@/lib/currency/currency-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') as 'earned' | 'spent' | undefined
    const source = searchParams.get('source') as any

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const currencyService = getCurrencyService()
    const transactions = await currencyService.getTransactionHistory(userId, {
      limit,
      offset,
      type,
      source
    })

    return NextResponse.json(transactions)
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


