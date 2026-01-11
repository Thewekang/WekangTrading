import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Debug logging
  console.log('[MIDDLEWARE] Path:', pathname);
  console.log('[MIDDLEWARE] Session:', session ? `exists (role: ${session.user?.role})` : 'null');

  // Allow access to auth pages if not authenticated
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (session?.user) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes (user-only)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/trades') || pathname.startsWith('/targets') || pathname.startsWith('/analytics')) {
    if (!session?.user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Redirect admins to admin panel
    if (session.user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/overview', request.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.user.role !== 'ADMIN') {
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trades/:path*',
    '/targets/:path*',
    '/analytics/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
