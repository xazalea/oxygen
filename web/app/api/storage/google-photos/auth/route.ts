import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
  'https://www.googleapis.com/auth/photoslibrary.sharing'
].join(' ')

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_PHOTOS_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/storage/google-photos/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_PHOTOS_CLIENT_ID not set' }, { status: 500 })
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `access_type=offline&` + // Important for refresh token
    `prompt=consent` // Force consent to ensure refresh token

  return NextResponse.redirect(authUrl)
}


