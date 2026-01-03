import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'oxygen-api',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}


