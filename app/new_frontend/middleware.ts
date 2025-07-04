import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define routes that require authentication
const protectedRoutes = [
  '/chat',
  '/study-assistant',
  '/dashboard',
  '/profile',
  '/progress',
  '/badges',
  '/assignments',
]

// Define authentication routes
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
]

// Define public routes - these don't require authentication
const publicRoutes = [
  '/',           // Landing page
  '/register',   // Registration page is also public
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth state cookie
  const hasToken = request.cookies.has("auth_state")

  // Skip middleware for static files
  if (
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.jpeg') ||
    pathname.includes('.svg') ||
    pathname.includes('.ico') ||
    pathname.includes('/images/') ||
    pathname.startsWith('/linktree-qr')
  ) {
    return NextResponse.next()
  }

  // If user is authenticated and tries to access auth pages, redirect to study-assistant
  if (hasToken && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/study-assistant", request.url))
  }

  // If user is not authenticated and tries to access protected routes, redirect to login
  if (!hasToken && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname) // Save original destination for redirect after login
    return NextResponse.redirect(url)
  }

  // If user is not authenticated and tries to access any route not in publicRoutes,
  // redirect to landing page (except for API routes and static assets)
  if (!hasToken && !publicRoutes.includes(pathname)) {
    if (!pathname.startsWith('/api/') &&
        !pathname.startsWith('/_next/') &&
        !pathname.includes('.') &&
        !pathname.startsWith('/linktree-qr')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

// Match all routes EXCEPT static assets and API routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
}