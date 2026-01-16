/**
 * GET /api/messages - Get user's motivational messages
 * PATCH /api/messages/:id/read - Mark message as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { motivationalMessages } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build query
    let query = db
      .select()
      .from(motivationalMessages)
      .where(eq(motivationalMessages.userId, session.user.id))
      .orderBy(desc(motivationalMessages.createdAt))
      .limit(limit);

    if (unreadOnly) {
      query = db
        .select()
        .from(motivationalMessages)
        .where(
          and(
            eq(motivationalMessages.userId, session.user.id),
            eq(motivationalMessages.isRead, false)
          )
        )
        .orderBy(desc(motivationalMessages.createdAt))
        .limit(limit);
    }

    const messages = await query;

    // Count unread messages
    const unreadMessages = await db
      .select()
      .from(motivationalMessages)
      .where(
        and(
          eq(motivationalMessages.userId, session.user.id),
          eq(motivationalMessages.isRead, false)
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        data: messages,
        unreadCount: unreadMessages.length,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } },
      { status: 500 }
    );
  }
}
