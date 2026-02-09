import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/utils/apiErrors';

export async function GET() {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoints disabled in production' },
      { status: 404 }
    );
  }

  // Require admin authentication
  const session = await auth();
  const adminError = requireAdmin(session);
  if (adminError) return adminError;

  return NextResponse.json({
    env_check: {
      DATABASE_URL_configured: !!process.env.DATABASE_URL,
      DATABASE_AUTH_TOKEN_configured: !!process.env.DATABASE_AUTH_TOKEN,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_configured: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
