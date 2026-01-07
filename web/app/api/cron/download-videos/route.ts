import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * DEPRECATED: This cron job is replaced by the distributed worker system.
 * See /api/worker/task and /api/worker/submit
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'This cron job is deprecated. Distributed workers are now handling video fetching.'
  })
}

