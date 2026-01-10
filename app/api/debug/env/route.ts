import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env_check: {
      DATABASE_URL_exists: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 30) + '...',
      DATABASE_AUTH_TOKEN_exists: !!process.env.DATABASE_AUTH_TOKEN,
      DATABASE_AUTH_TOKEN_length: process.env.DATABASE_AUTH_TOKEN?.length || 0,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET_exists: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
}
