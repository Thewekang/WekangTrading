/**
 * Invite Code Service
 * Handles invite code generation, validation, and management
 */

import { prisma } from '@/lib/db';
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
    const existing = await prisma.inviteCode.findUnique({
      where: { code },
    });
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

  return await prisma.inviteCode.create({
    data: {
      code,
      createdBy,
      maxUses,
      expiresAt,
      active: true,
    },
  });
}

/**
 * Validate an invite code
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  message?: string;
  inviteCodeId?: string;
}> {
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!inviteCode) {
    return { valid: false, message: 'Invalid invite code' };
  }

  if (!inviteCode.active) {
    return { valid: false, message: 'Invite code is no longer active' };
  }

  if (inviteCode.usedCount >= inviteCode.maxUses) {
    return { valid: false, message: 'Invite code has been fully used' };
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    return { valid: false, message: 'Invite code has expired' };
  }

  return { valid: true, inviteCodeId: inviteCode.id };
}

/**
 * Use an invite code (increment usage count)
 */
export async function useInviteCode(code: string): Promise<void> {
  await prisma.inviteCode.update({
    where: { code: code.toUpperCase() },
    data: {
      usedCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Get all invite codes (admin)
 */
export async function getAllInviteCodes() {
  return await prisma.inviteCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Deactivate an invite code
 */
export async function deactivateInviteCode(id: string): Promise<void> {
  await prisma.inviteCode.update({
    where: { id },
    data: { active: false },
  });
}

/**
 * Delete an invite code
 */
export async function deleteInviteCode(id: string): Promise<void> {
  await prisma.inviteCode.delete({
    where: { id },
  });
}
