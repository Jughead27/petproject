import { createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - admin only' }), { status: 403 })
    }

    const body = await request.json() as {
      action: 'hide_pet' | 'restore_pet' | 'ban_user' | 'unban_user' | 'dismiss_report' | 'resolve_report'
      reportId?: string
      petId?: string
      userId?: string
      adminNote?: string
    }

    if (body.action === 'hide_pet' && body.petId) {
      await supabaseAdmin
        .from('pets')
        .update({ is_hidden: true })
        .eq('id', body.petId)

      if (body.reportId) {
        await supabaseAdmin
          .from('reports')
          .update({
            status: 'reviewed',
            reviewed_by: userData.user.id,
            reviewed_at: new Date().toISOString(),
            admin_note: body.adminNote,
          })
          .eq('id', body.reportId)
      }

      return new Response(JSON.stringify({ success: true, action: 'hide_pet' }), { status: 200 })
    }

    if (body.action === 'restore_pet' && body.petId) {
      await supabaseAdmin
        .from('pets')
        .update({ is_hidden: false })
        .eq('id', body.petId)

      if (body.reportId) {
        await supabaseAdmin
          .from('reports')
          .update({ status: 'dismissed', reviewed_by: userData.user.id, reviewed_at: new Date().toISOString() })
          .eq('id', body.reportId)
      }

      return new Response(JSON.stringify({ success: true, action: 'restore_pet' }), { status: 200 })
    }

    if (body.action === 'ban_user' && body.userId) {
      await supabaseAdmin
        .from('users')
        .update({ is_banned: true })
        .eq('id', body.userId)

      if (body.reportId) {
        await supabaseAdmin
          .from('reports')
          .update({
            status: 'reviewed',
            reviewed_by: userData.user.id,
            reviewed_at: new Date().toISOString(),
            admin_note: body.adminNote || 'User banned',
          })
          .eq('id', body.reportId)
      }

      return new Response(JSON.stringify({ success: true, action: 'ban_user' }), { status: 200 })
    }

    if (body.action === 'unban_user' && body.userId) {
      await supabaseAdmin
        .from('users')
        .update({ is_banned: false })
        .eq('id', body.userId)

      return new Response(JSON.stringify({ success: true, action: 'unban_user' }), { status: 200 })
    }

    if (body.action === 'dismiss_report' && body.reportId) {
      await supabaseAdmin
        .from('reports')
        .update({
          status: 'dismissed',
          reviewed_by: userData.user.id,
          reviewed_at: new Date().toISOString(),
          admin_note: body.adminNote,
        })
        .eq('id', body.reportId)

      return new Response(JSON.stringify({ success: true, action: 'dismiss_report' }), { status: 200 })
    }

    if (body.action === 'resolve_report' && body.reportId) {
      await supabaseAdmin
        .from('reports')
        .update({
          status: 'reviewed',
          reviewed_by: userData.user.id,
          reviewed_at: new Date().toISOString(),
          admin_note: body.adminNote,
        })
        .eq('id', body.reportId)

      return new Response(JSON.stringify({ success: true, action: 'resolve_report' }), { status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
  } catch (err) {
    console.error('Admin action error:', err)
    return new Response(JSON.stringify({ error: 'Failed to execute action' }), { status: 500 })
  }
}
