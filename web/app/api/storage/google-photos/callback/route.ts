import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.json({ error }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_PHOTOS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_PHOTOS_CLIENT_SECRET
  const redirectUri = `${request.nextUrl.origin}/api/storage/google-photos/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Configuration missing' }, { status: 500 })
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      return NextResponse.json(tokens, { status: 400 })
    }

    // Return the refresh token to the user
    return new NextResponse(`
      <html>
        <head><title>Google Photos Auth Success</title></head>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h1>Authentication Successful</h1>
          <p>Please add the following to your .env.local file:</p>
          <pre style="background: #f0f0f0; padding: 1rem; border-radius: 4px;">GOOGLE_PHOTOS_REFRESH_TOKEN=${tokens.refresh_token}</pre>
          <p>Access Token (temporary):</p>
          <pre style="background: #f0f0f0; padding: 1rem; border-radius: 4px; overflow-x: auto;">${tokens.access_token}</pre>
          <p>⚠️ <strong>Important:</strong> Keep your refresh token secret.</p>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

  } catch (err: any) {
    console.error('Token exchange failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


