import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Allow access to auth pages if not authenticated
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes (user-only)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/trades') || pathname.startsWith('/targets') || pathname.startsWith('/analytics')) {
    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Redirect admins to admin panel
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/overview', request.url));
    }
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (token.role !== 'ADMIN') {
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
