import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context; session refresh happens in background
          }
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Routes that require authentication
  const protectedRoutes = ['/stack', '/dex', '/pets', '/profile', '/setup-username', '/onboarding', '/packs', '/my-packs', '/notifications']

  // Routes that are auth-only (not accessible if logged in)
  const authRoutes = ['/login', '/signup']

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    // Check if user has any pets
    const { count } = await supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    // If count is 0 or null, go to onboarding; otherwise go to stack
    const destination = count && count > 0 ? '/stack' : '/onboarding'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Redirect root path for logged-in users
  if (user && pathname === '/') {
    const { count } = await supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    const destination = count && count > 0 ? '/stack' : '/onboarding'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // For authenticated users on protected routes, check onboarding status
  if (user && isProtectedRoute && pathname !== '/setup-username' && pathname !== '/onboarding') {
    const { data: userRecord } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    // If no username, redirect to setup
    if (!userRecord?.username) {
      return NextResponse.redirect(new URL('/setup-username', request.url))
    }

    // If has username but no pets, redirect to onboarding
    const { count } = await supabase
      .from('pets')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    if (!count || count === 0) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Redirect unauthenticated users to login for protected routes
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /signup is protected by requiring invite in localStorage (checked on client)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
