import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, count as countFn } from 'drizzle-orm';
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

  try {
    const [{ value: userCount }] = await db.select({ value: countFn() }).from(users);
    
    // Check if admin exists (no sensitive details)
    const adminCount = await db
      .select({ value: countFn() })
      .from(users)
      .where(eq(users.role, 'ADMIN'));

    return NextResponse.json({
      status: 'connected',
      database_working: true,
      total_users: userCount,
      total_admins: adminCount[0].value,
      timestamp: new Date().toISOString(),
      env: {
        DATABASE_URL_configured: !!process.env.DATABASE_URL,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('DB status check failed:', {
      type: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({
      status: 'error',
      database_working: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
