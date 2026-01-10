import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deactivateInviteCode, deleteInviteCode } from '@/lib/services/inviteCodeService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      await deleteInviteCode(id);
    } else {
      await deactivateInviteCode(id);
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Invite code deleted' : 'Invite code deactivated',
    });
  } catch (error) {
    console.error('Error deleting invite code:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete invite code' } },
      { status: 500 }
    );
  }
}
