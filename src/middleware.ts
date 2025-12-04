import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Update the Supabase session
  const response = await updateSession(request)

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/dashboard/events',
    '/dashboard/registration',
    '/dashboard/venues',
    '/dashboard/floor-plans',
    '/dashboard/attendees',
    '/dashboard/networking',
    '/dashboard/check-in',
    '/dashboard/surveys',
    '/dashboard/analytics',
    '/dashboard/rfp',
    '/dashboard/messages',
    '/dashboard/profile',
    '/dashboard/settings',
  ]

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  // For now, allow access to all routes for development
  // In production, uncomment this block to enforce authentication
  /*
  if (isProtectedRoute) {
    const supabase = createMiddlewareClient({ req: request, res: response })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  */

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
