import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_confirmation_link', request.url)
    )
  }

  // Redirect to client page that will handle code exchange with browser client
  return NextResponse.redirect(new URL(`/auth/confirm?code=${code}`, request.url))
}
