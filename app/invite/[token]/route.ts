import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = await params

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_invite', request.url))
  }

  // Redirect to signup with token in query param
  // Client will store in localStorage and validate
  return NextResponse.redirect(new URL(`/signup?invite=${encodeURIComponent(token)}`, request.url))
}
