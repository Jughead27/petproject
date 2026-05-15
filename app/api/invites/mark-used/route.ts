import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { token, userId } = await request.json()

  if (!token || !userId) {
    return NextResponse.json({ error: 'Missing token or userId' }, { status: 400 })
  }

  try {
    // Use service role key to bypass RLS and update the invite
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { error } = await supabase
      .from('invites')
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq('token', token)

    if (error) {
      console.error('Mark invite used error:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Failed to mark invite as used' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Invite API error:', {
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
