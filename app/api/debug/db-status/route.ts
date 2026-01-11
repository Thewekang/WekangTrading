import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq, count as countFn } from 'drizzle-orm';

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count();
    
    // Test if admin exists
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@wekangtrading.com' },
      select: { id: true, email: true, role: true }
    });

    return NextResponse.json({
      status: 'connected',
      database_working: true,
      total_users: userCount,
      admin_exists: !!adminExists,
      admin_details: adminExists ? {
        email: adminExists.email,
        role: adminExists.role,
        id: adminExists.id
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
