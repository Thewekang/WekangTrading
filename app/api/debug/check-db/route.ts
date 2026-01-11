import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Check if admin exists
    const adminUsers = await db
      .select({ email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.role, 'ADMIN'))
      .limit(5);

    return NextResponse.json({
      success: true,
      dbUrl: process.env.TURSO_DATABASE_URL?.substring(0, 50) + '...',
      adminUsers,
      totalAdmins: adminUsers.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      dbUrl: process.env.TURSO_DATABASE_URL?.substring(0, 50) + '...',
    }, { status: 500 });
  }
}
