/**
 * PATCH /api/messages/[id]/read - Mark message as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { motivationalMessages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { id: messageId } = await params;

    // Verify message belongs to user
    const [message] = await db
      .select()
      .from(motivationalMessages)
      .where(
        and(
          eq(motivationalMessages.id, messageId),
          eq(motivationalMessages.userId, session.user.id)
        )
      )
      .limit(1);

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Message not found' } },
        { status: 404 }
      );
    }

    // Mark as read
    await db
      .update(motivationalMessages)
      .set({ isRead: true })
      .where(eq(motivationalMessages.id, messageId));

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to mark message as read' } },
      { status: 500 }
    );
  }
}
