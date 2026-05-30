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
  const protectedRoutes = ['/stack', '/dex', '/pets', '/profile', '/setup-username', '/onboarding', '/create', '/packs', '/my-packs', '/notifications', '/admin']

  // Routes that are auth-only (not accessible if logged in)
  const authRoutes = ['/login', '/signup']

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect root path
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Check if user is banned
  if (user && pathname !== '/banned') {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', user.id)
        .single()

      if (userData?.is_banned) {
        return NextResponse.redirect(new URL('/banned', request.url))
      }
    } catch (err) {
      console.error('Ban check error:', err)
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Redirect unauthenticated users to login for protected routes
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
  ],
}
