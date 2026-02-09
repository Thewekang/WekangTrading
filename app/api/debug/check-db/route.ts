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
    // Count admin users (no personal details)
    const adminCount = await db
      .select({ value: countFn() })
      .from(users)
      .where(eq(users.role, 'ADMIN'));

    return NextResponse.json({
      success: true,
      totalAdmins: adminCount[0].value,
      dbConfigured: !!process.env.TURSO_DATABASE_URL,
    });
  } catch (error: any) {
    console.error('DB check failed:', {
      type: error?.constructor?.name,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({
      success: false,
      error: 'Database query failed',
    }, { status: 500 });
  }
}
