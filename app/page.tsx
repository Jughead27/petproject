import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, go to login
  if (!user) {
    redirect('/login')
  }

  // If logged in, check for username
  const { data: userData } = await supabase
    .from('users')
    .select('username')
    .eq('id', user.id)
    .single()

  // If no username, go to setup
  if (!userData?.username) {
    redirect('/setup-username')
  }

  // If has username, go to stack
  redirect('/stack')
}
