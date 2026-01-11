import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, count as countFn } from 'drizzle-orm';

export async function GET() {
  try {
    // TODO: Implement Drizzle count query
    const [{ value: userCount }] = await db.select({ value: countFn() }).from(users);
    
    // Check if admin exists
    const [adminUser] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, 'admin@wekangtrading.com'))
      .limit(1);

    return NextResponse.json({
      status: 'connected',
      database_working: true,
      total_users: userCount,
      admin_exists: !!adminUser,
      admin_details: adminUser ? {
        email: adminUser.email,
        role: adminUser.role,
        id: adminUser.id
      } : null,
      timestamp: new Date().toISOString(),
      env: {
        DATABASE_URL_set: !!process.env.DATABASE_URL,
        DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 40) + '...',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      database_working: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      env: {
        DATABASE_URL_set: !!process.env.DATABASE_URL,
        DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 40) + '...',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
