import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of routes that require authentication
const protectedRoutes = ['/admin', '/protected'];

// List of auth routes (should be accessible only to non-authenticated users)
const authRoutes = ['/auth/login', '/auth/sign-up'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for test-login page
  if (pathname === '/test-login') {
    return NextResponse.next();
  }
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get access token from cookie
  const accessToken = request.cookies.get('access_token')?.value;
  
  // Simple check - if token exists, user is authenticated
  const isAuthenticated = !!accessToken;
  
  console.log('Middleware check:', {
    pathname,
    isProtectedRoute,
    isAuthRoute,
    hasToken: !!accessToken,
    isAuthenticated
  });
  
  // Redirect logic
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if trying to access protected route without auth
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  if (isAuthRoute && isAuthenticated) {
    // Redirect to admin if trying to access auth routes while authenticated
    return NextResponse.redirect(new URL('/admin/leads', request.url));
  }
  
  // Continue with the request
  return NextResponse.next();
}