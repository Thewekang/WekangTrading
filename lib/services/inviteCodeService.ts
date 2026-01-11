/**
 * Invite Code Service
 * Handles invite code generation, validation, and management
 */

import { db } from '@/lib/db';
import { inviteCodes, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

/**
 * Generate a unique invite code
 */
function generateCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create a new invite code
 */
export async function createInviteCode(
  createdBy: string,
  options: {
    maxUses?: number;
    expiresInDays?: number;
  } = {}
) {
  const { maxUses = 1, expiresInDays } = options;

  let code = generateCode();
  let isUnique = false;
  let attempts = 0;

  // Ensure code is unique
  while (!isUnique && attempts < 10) {
    const [existing] = await db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code))
      .limit(1);
    if (!existing) {
      isUnique = true;
    } else {
      code = generateCode();
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique invite code');
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const [newCode] = await db
    .insert(inviteCodes)
    .values({
      code,
      createdBy,
      maxUses,
      expiresAt,
      active: true,
    })
    .returning();

  return newCode;
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  message?: string;
  inviteCodeId?: string;
}> {
  const [inviteCode] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code.toUpperCase()))
    .limit(1);

  if (!inviteCode) {
    return { valid: false, message: 'Invalid invite code' };
  }

  if (!inviteCode.active) {
    return { valid: false, message: 'Invite code is no longer active' };
  }

  if (inviteCode.usedCount >= inviteCode.maxUses) {
    return { valid: false, message: 'Invite code has been fully used' };
  }

  const now = new Date();
  if (inviteCode.expiresAt && inviteCode.expiresAt < now) {
    return { valid: false, message: 'Invite code has expired' };
  }

  return { valid: true, inviteCodeId: inviteCode.id };
}

/**
 * Use an invite code (increment usage count)
 */
export async function useInviteCode(code: string): Promise<void> {
  const [inviteCode] = await db
    .select()
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code.toUpperCase()))
    .limit(1);

  if (inviteCode) {
    await db
      .update(inviteCodes)
      .set({ usedCount: inviteCode.usedCount + 1 })
      .where(eq(inviteCodes.code, code.toUpperCase()));
  }
}

/**
 * Get all invite codes (admin)
 */
export async function getAllInviteCodes() {
  // Get all invite codes
  const codes = await db
    .select()
    .from(inviteCodes)
    .orderBy(inviteCodes.createdAt);

  // Get users for each invite code
  const codesWithUsers = await Promise.all(
    codes.map(async (code) => {
      const codeUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.inviteCodeId, code.id));

      return {
        ...code,
        users: codeUsers,
      };
    })
  );

  return codesWithUsers;
}

/**
 * Deactivate an invite code
 */
export async function deactivateInviteCode(id: string): Promise<void> {
  await db
    .update(inviteCodes)
    .set({ active: false })
    .where(eq(inviteCodes.id, id));
}

/**
 * Delete an invite code
 */
export async function deleteInviteCode(id: string): Promise<void> {
  await db
    .delete(inviteCodes)
    .where(eq(inviteCodes.id, id));
}
