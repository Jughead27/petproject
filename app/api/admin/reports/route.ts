import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || 'pending'
  const page = parseInt(url.searchParams.get('page') || '0')
  const limit = 20
  const offset = page * limit

  try {
    const supabase = await createServerSupabaseClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'moderator')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const { data, count } = await supabase
      .from('reports')
      .select(
        `id,reason,status,created_at,additional_info,
        reporter_id,reported_pet_id,
        pets:reported_pet_id(id,name,species,avatar_url,owner_id),
        users:reporter_id(username)`,
        { count: 'exact' }
      )
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return new Response(
      JSON.stringify({
        reports: data,
        total: count,
        page,
        pages: Math.ceil((count || 0) / limit),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Reports fetch error:', err)
    return new Response(JSON.stringify({ error: 'Failed to fetch reports' }), { status: 500 })
  }
}
