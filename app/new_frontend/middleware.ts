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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth state cookie
  const hasToken = request.cookies.has("auth_state")

  // If user is authenticated and tries to access auth pages, redirect to study-assistant
  if (hasToken && authRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/study-assistant", request.url))
  }

  // If user is not authenticated and tries to access protected pages, redirect to login
  if (!hasToken && protectedRoutes.some(route => pathname.startsWith(route))) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname) // Save original destination for redirect after login
    return NextResponse.redirect(url)
  }

  // For API routes, add the user ID from local storage if available
  // Note: This won't work directly in middleware since it can't access localStorage
  // Instead, we'll use a client-side approach where components add the user ID to requests

  return NextResponse.next()
}

// Match all routes EXCEPT static assets and API routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
}